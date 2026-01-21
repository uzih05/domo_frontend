// src/app/components/page.tsx

"use client";

import { useState } from "react";
<<<<<<< HEAD
import { LoginScreen } from "../components/LoginScreen";
import { SignupScreen } from "../components/SignupScreen";
import { VerifyEmailScreen } from "../components/VerifyEmailScreen";
import { VerifySuccessScreen } from "../components/VerifySuccessScreen";
import { ProjectSelect } from "../components/ui/ProjectSelect";
import { WorkspaceBoard } from "../components/board/WorkspaceBoard";
import type { Project, AuthUser } from "@/src/types"; // types 경로 확인 필요

// 화면 상태를 정의하는 타입
type AuthScreen = 'login' | 'signup' | 'verify' | 'verify-success';
=======
// 1. [수정] 같은 폴더에 있으므로 ./LoginScreen
import { LoginScreen } from "./LoginScreen";
// 2. [수정] 하위 폴더 참조 수정
import { ProjectSelect } from "./ui/ProjectSelect";
import { WorkspaceBoard } from "./board/WorkspaceBoard";
import type { Project, AuthUser } from "@/src/types";
>>>>>>> abaf587 (WIP: Changes before switching to dev)

export default function Home() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

    // 회원가입 성공 시 → 이메일 인증 화면으로 이동
    const handleSignupSuccess = (email: string) => {
        setPendingEmail(email);
        setAuthScreen('verify');
    };

    // 이메일 인증 성공 시 → 성공 화면으로 이동
    const handleVerifySuccess = () => {
        setAuthScreen('verify-success');
    };

    // 인증 코드 재전송 (필요 시 구현)
    const handleResendCode = async () => {
        console.log('인증 코드 재전송 요청:', pendingEmail);
    };

    // 1. 로그인이 안 된 상태라면? → authScreen 상태에 따라 알맞은 화면을 보여줍니다.
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
                // LoginScreen에 onGoToSignup을 전달하여 오류를 해결했습니다.
                return (
                    <LoginScreen
                        onLoginSuccess={handleLoginSuccess}
                        onGoToSignup={() => setAuthScreen('signup')}
                    />
                );
        }
    }

    // 2. 로그인됨, 프로젝트 미선택 → 프로젝트 선택 화면
    if (!selectedProject) {
        return (
            <ProjectSelect
                user={user}
                onSelectProject={handleSelectProject}
                onLogout={handleLogout}
            />
        );
    }

    // 3. 프로젝트 선택됨 → 워크스페이스 보드
    return (
<<<<<<< HEAD
        <div className="h-screen w-full overflow-hidden">
            <WorkspaceBoard
                project={selectedProject}
                onBack={handleBackToProjects}
            />
        </div>
=======
        <WorkspaceBoard
            project={selectedProject}
            user={user} // 👈 [중요] 이전 에러 해결을 위해 user prop 추가
            onBack={handleBackToProjects}
        />
>>>>>>> abaf587 (WIP: Changes before switching to dev)
    );
}