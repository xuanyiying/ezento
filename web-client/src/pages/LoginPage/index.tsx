import React from 'react';
import LoginForm from './components/LoginForm';
import './login.less';

const LoginPage: React.FC = () => {
    return (
        <div className="login-wrapper">
            <div className="container">
                <div className="left-panel">
                    <div className="logo">
                        <img src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png" alt="Logo" />
                        <div className="logo-text">智慧医疗</div>
                    </div>
                    <h1 className="slogan">让医疗更智能<br />健康更便捷</h1>
                    <p className="description">
                        智慧医疗平台为您提供专业的在线问诊、健康咨询和医疗服务，让您足不出户即可享受高质量的医疗资源。
                    </p>
                    <div className="features">
                        <div className="feature">
                            <div className="feature-icon">✓</div>
                            <div>智能问诊，快速获得专业建议</div>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">✓</div>
                            <div>全天候服务，随时随地咨询</div>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">✓</div>
                            <div>医学报告解读，简单易懂</div>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">✓</div>
                            <div>个人健康管理，科学规划</div>
                        </div>
                    </div>
                </div>
                <div className="right-panel">
                    <div className="form-container">
                        <LoginForm />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 