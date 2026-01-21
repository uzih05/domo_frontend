"use client";

import { useState } from "react";
// 👇 [수정] 경로에 components/ 추가
import { LoginScreen } from "./components/LoginScreen";
<<<<<<< HEAD
import { SignupScreen } from "./components/SignupScreen";
import { VerifyEmailScreen } from "./components/VerifyEmailScreen";
import { VerifySuccessScreen } from "./components/VerifySuccessScreen";
import { ProjectSelect } from "./components/ui/ProjectSelect";
import { WorkspaceBoard } from "./components/board/WorkspaceBoard";
import type { Project, AuthUser } from "../types/index";
=======
// 👇 [수정] 경로에 components/ 추가
import { ProjectSelect } from "./components/ui/ProjectSelect";
// 👇 [수정] 경로에 components/ 추가
import { WorkspaceBoard } from "./components/board/WorkspaceBoard";
import type { Project, AuthUser } from "@/src/types";
>>>>>>> abaf587 (WIP: Changes before switching to dev)

type AuthScreen = 'login' | 'signup' | 'verify' | 'verify-success';

export default function Home() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // 인증 화면 상태 관리
    const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
    const [pendingEmail, setPendingEmail] = useState<string>('');

    const handleLoginSuccess = (loggedInUser: AuthUser) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
        setSelectedProject(null);
        setAuthScreen('login');
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
    };

    const handleBackToProjects = () => {
        setSelectedProject(null);
    };

    // 회원가입 성공 시 → 이메일 인증 화면으로
    const handleSignupSuccess = (email: string) => {
        setPendingEmail(email);
        setAuthScreen('verify');
    };

    // 이메일 인증 성공 시 → 성공 화면으로
    const handleVerifySuccess = () => {
        setAuthScreen('verify-success');
    };

    // 인증 코드 재전송
    const handleResendCode = async () => {
        // 백엔드에 재전송 API가 있다면 호출
        // 현재는 signup을 다시 호출하면 코드가 재생성됨
        // 실제로는 별도의 resend API를 만드는 것이 좋음
        try {
            // 임시: 콘솔에 로그만 출력
            console.log('인증 코드 재전송 요청:', pendingEmail);
            // await resendVerificationCode(pendingEmail);
        } catch (err) {
            console.error('재전송 실패:', err);
        }
    };

    // 로그인 전 - 인증 화면들
    if (!user) {
        switch (authScreen) {
            case 'signup':
                return (
                    <SignupScreen
                        onSignupSuccess={handleSignupSuccess}
                        onBackToLogin={() => setAuthScreen('login')}
                    />
                );

            case 'verify':
                return (
                    <VerifyEmailScreen
                        email={pendingEmail}
                        onVerifySuccess={handleVerifySuccess}
                        onBackToSignup={() => setAuthScreen('signup')}
                        onResendCode={handleResendCode}
                    />
                );

            case 'verify-success':
                return (
                    <VerifySuccessScreen
                        onGoToLogin={() => setAuthScreen('login')}
                    />
                );

            default:
                return (
                    <LoginScreen
                        onLoginSuccess={handleLoginSuccess}
                        onGoToSignup={() => setAuthScreen('signup')}
                    />
                );
        }
    }

    // 로그인됨, 프로젝트 미선택 → 프로젝트 선택 화면
    if (!selectedProject) {
        return (
            <ProjectSelect
                user={user}
                onSelectProject={handleSelectProject}
                onLogout={handleLogout}
            />
        );
    }

<<<<<<< HEAD
    // 프로젝트 선택됨 → 워크스페이스 보드
=======
    // 3. 프로젝트 선택됨 → 워크스페이스 보드
>>>>>>> abaf587 (WIP: Changes before switching to dev)
    return (
        <div className="h-screen w-full overflow-hidden">
            <WorkspaceBoard
                project={selectedProject}
                user={user}
                onBack={handleBackToProjects}
            />
        </div>
    );
}