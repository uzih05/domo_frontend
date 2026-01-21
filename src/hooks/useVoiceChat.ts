import { useEffect, useRef, useState, useCallback } from 'react';

// 시그널링 데이터 타입 정의
interface SignalData {
    type: 'join' | 'offer' | 'answer' | 'ice' | 'user_left';
    senderId: number;
    targetId?: number;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

export function useVoiceChat(projectId: number, userId: number) {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);

    // ✨ [변경] 숫자 대신 '참여자 ID 목록'을 관리합니다.
    const [activePeerIds, setActivePeerIds] = useState<number[]>([]);

    const isDeafenedRef = useRef(false);
    const socketRef = useRef<WebSocket | null>(null);
    const pcsRef = useRef<{ [key: number]: RTCPeerConnection }>({});
    const remoteAudiosRef = useRef<{ [key: number]: HTMLAudioElement }>({});
    const localStreamRef = useRef<MediaStream | null>(null);

    // 1. 정리(나가기) 함수
    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up voice chat...');
        setIsConnected(false);
        setIsMuted(false);
        setIsDeafened(false);
        setActivePeerIds([]); // ✨ 목록 초기화
        isDeafenedRef.current = false;

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        Object.keys(pcsRef.current).forEach((key) => {
            pcsRef.current[parseInt(key)].close();
        });
        pcsRef.current = {};
        remoteAudiosRef.current = {};

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
    }, []);

    // 2. 음성 채팅방 입장
    const joinVoiceChannel = useCallback(async () => {
        if (isConnected || socketRef.current) return;

        if (typeof navigator !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
            alert("브라우저 보안 정책으로 마이크를 켤 수 없습니다.\n(HTTPS 또는 localhost 필요)");
            return;
        }

        try {
            console.log('🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false
            });

            localStreamRef.current = stream;

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            const port = window.location.protocol === 'https:' ? '' : ':9000';
            const wsUrl = `http://172.17.0.130:9000/ws/projects/${projectId}/voice`;

            console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);

            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log('🟢 WebSocket Connected!');
                setIsConnected(true);
                // ✨ 입장 시 '나 자신(userId)'을 목록에 추가
                setActivePeerIds([userId]);
                ws.send(JSON.stringify({ type: 'join', senderId: userId }));
            };

            ws.onmessage = async (event) => {
                const data: SignalData = JSON.parse(event.data);
                if (data.targetId && data.targetId !== userId) return;

                switch (data.type) {
                    case 'join':
                        createPeerConnection(data.senderId, stream, true);
                        break;
                    case 'offer':
                        await handleOffer(data.senderId, data.sdp!, stream);
                        break;
                    case 'answer':
                        await handleAnswer(data.senderId, data.sdp!);
                        break;
                    case 'ice':
                        await handleIce(data.senderId, data.candidate!);
                        break;
                    case 'user_left':
                        closePeerConnection(data.senderId);
                        delete remoteAudiosRef.current[data.senderId];
                        break;
                }
            };

            ws.onerror = (error) => {
                console.error('🔴 WebSocket Error:', error);
                cleanup();
            };

            ws.onclose = () => cleanup();

        } catch (err) {
            console.error('❌ Failed to join voice chat:', err);
            cleanup();
        }
    }, [projectId, userId, isConnected, cleanup]);

    // 3. Peer Connection 생성
    const createPeerConnection = async (peerId: number, stream: MediaStream, isOfferer: boolean) => {
        if (pcsRef.current[peerId]) return;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcsRef.current[peerId] = pc;

        // ✨ [추가] 새로운 유저 ID를 목록에 추가 (중복 방지)
        setActivePeerIds(prev => {
            if (prev.includes(peerId)) return prev;
            return [...prev, peerId];
        });

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            const remoteAudio = new Audio();
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.autoplay = true;
            remoteAudio.muted = isDeafenedRef.current;
            remoteAudiosRef.current[peerId] = remoteAudio;
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'ice',
                    senderId: userId,
                    targetId: peerId,
                    candidate: event.candidate
                }));
            }
        };

        if (isOfferer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.send(JSON.stringify({
                type: 'offer',
                senderId: userId,
                targetId: peerId,
                sdp: offer
            }));
        }
    };

    const handleOffer = async (senderId: number, sdp: RTCSessionDescriptionInit, stream: MediaStream) => {
        await createPeerConnection(senderId, stream, false);
        const pc = pcsRef.current[senderId];
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.send(JSON.stringify({
            type: 'answer',
            senderId: userId,
            targetId: senderId,
            sdp: answer
        }));
    };

    const handleAnswer = async (senderId: number, sdp: RTCSessionDescriptionInit) => {
        const pc = pcsRef.current[senderId];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
    };

    const handleIce = async (senderId: number, candidate: RTCIceCandidateInit) => {
        const pc = pcsRef.current[senderId];
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const closePeerConnection = (peerId: number) => {
        if (pcsRef.current[peerId]) {
            pcsRef.current[peerId].close();
            delete pcsRef.current[peerId];
            // ✨ [추가] 나간 유저 ID를 목록에서 제거
            setActivePeerIds(prev => prev.filter(id => id !== peerId));
        }
        if (remoteAudiosRef.current[peerId]) {
            remoteAudiosRef.current[peerId].pause();
            delete remoteAudiosRef.current[peerId];
        }
    };

    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    const toggleDeafen = useCallback(() => {
        const newState = !isDeafenedRef.current;
        isDeafenedRef.current = newState;
        setIsDeafened(newState);

        Object.values(remoteAudiosRef.current).forEach(audio => {
            audio.muted = newState;
        });
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return {
        isConnected,
        isMuted,
        isDeafened,
        activePeerIds, // ✨ ID 목록 반환
        joinVoiceChannel,
        leaveVoiceChannel: cleanup,
        toggleMute,
        toggleDeafen
    };
}