import React, { useState } from 'react';
import { Layout, Steps, Form, Input, Radio, Checkbox, Button, Card, Tooltip, message, Avatar } from 'antd';
import { UserOutlined, ExclamationCircleOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import './GuidePage.less';

const { Header, Content } = Layout;
const { Step } = Steps;
const { TextArea } = Input;

// 类型定义
interface Department {
    id: string;
    name: string;
    description: string;
  probability: number;
  icon: string;
}

interface Symptom {
    id: string;
    name: string;
}

interface PossibleDisease {
  name: string;
}

interface RecommendedTest {
    name: string;
}

const GuidePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.user);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [symptomDescription, setSymptomDescription] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [intensity, setIntensity] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
  // 模拟科室数据
    const departments: Department[] = [
    { 
      id: 'digestive', 
      name: '消化内科', 
      description: '处理胃痛、胃酸倒流、消化不良等症状', 
      probability: 92,
      icon: '👨‍⚕️'
    },
    { 
      id: 'general', 
      name: '普通内科', 
      description: '处理常见疾病和一般身体不适', 
      probability: 75,
      icon: '👩‍⚕️'
    },
    { 
      id: 'neuro', 
      name: '神经内科', 
      description: '处理头痛、眩晕等神经系统症状', 
      probability: 45,
      icon: '🧠'
    },
    { 
      id: 'cardio', 
      name: '心血管内科', 
      description: '处理心脏和血管相关疾病', 
      probability: 30,
      icon: '❤️'
    },
    { 
      id: 'respiratory', 
      name: '呼吸内科', 
      description: '处理呼吸系统疾病和症状', 
      probability: 25,
      icon: '🫁'
    },
    {   
      id: 'ortho', 
      name: '骨科', 
      description: '处理骨骼、关节和肌肉问题', 
      probability: 15,
      icon: '🦴'
    }
  ];

  // 模拟症状数据
  const commonSymptoms: Symptom[] = [
    { id: 's1', name: '腹痛' },
    { id: 's2', name: '腹泻' },
    { id: 's3', name: '恶心' },
    { id: 's4', name: '呕吐' },
    { id: 's5', name: '食欲不振' },
    { id: 's6', name: '烧心' },
    { id: 's7', name: '腹胀' },
    { id: 's8', name: '便秘' },
    { id: 's9', name: '消化不良' },
    { id: 's10', name: '体重减轻' },
    { id: 's11', name: '疲劳' },
    { id: 's12', name: '头痛' }
  ];
  
  // 模拟可能的疾病
  const possibleDiseases: PossibleDisease[] = [
    { name: '胃炎（慢性或急性）' },
    { name: '胃溃疡' },
    { name: '消化不良' },
    { name: '胃食管反流病' }
  ];
  
  // 模拟推荐检查项目
  const recommendedTests: RecommendedTest[] = [
    { name: '胃镜检查' },
    { name: '幽门螺杆菌检测' },
    { name: '腹部B超' }
  ];

  const getAvatarText = () => {
    if (user?.name && user.name.length > 0) {
      return user.name.charAt(0);
    }
    return '用';
  };

  const handleNext = () => {
    if (currentStep === 0 && !symptomDescription) {
      message.warning('请描述您的症状');
            return;
        }

    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    message.success('预约成功，我们将安排医生与您联系');
        setTimeout(() => {
      navigate('/service-selection');
    }, 1500);
  };

  const handleReturn = () => {
    navigate('/service-selection');
  };

  const handleSymptomChange = (checkedValues: string[]) => {
    setSelectedSymptoms(checkedValues);
  };

  const handleDepartmentSelect = (id: string) => {
    setSelectedDepartment(id);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
    return (
          <div className="step-content">
            <div className="form-title">请描述您的症状</div>
            <Form layout="vertical">
              <Form.Item
                label="症状描述"
                help="请详细描述您感到不适的部位和感觉"
              >
                <TextArea
                  rows={4}
                  placeholder="例如：我最近经常感到胃部疼痛，尤其是饭后感觉更明显"
                  value={symptomDescription}
                  onChange={(e) => setSymptomDescription(e.target.value)}
                />
              </Form.Item>
              
              <Form.Item label="症状持续时间">
                <Radio.Group value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <div className="radio-group">
                    <Radio value="hours">几小时</Radio>
                    <Radio value="days">几天</Radio>
                    <Radio value="weeks">几周</Radio>
                    <Radio value="months">几个月</Radio>
                    <Radio value="years">一年以上</Radio>
                  </div>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item label="症状强度">
                <Radio.Group value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                  <div className="radio-group">
                    <Radio value="mild">轻微</Radio>
                    <Radio value="moderate">中度</Radio>
                    <Radio value="severe">严重</Radio>
                  </div>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item label="其他伴随症状（可多选）">
                <Checkbox.Group 
                  className="checkbox-group" 
                  options={commonSymptoms.map(s => ({ label: s.name, value: s.id }))} 
                  value={selectedSymptoms}
                  onChange={handleSymptomChange as any}
                />
              </Form.Item>
            </Form>
          </div>
        );
      
      case 1:
        return (
          <div className="step-content">
            <div className="form-title">根据您的症状，我们推荐以下科室</div>
            
            <div className="department-cards">
              {departments.map((dept) => (
                <Card 
                  key={dept.id}
                  className={`department-card ${selectedDepartment === dept.id ? 'selected' : ''}`}
                  onClick={() => handleDepartmentSelect(dept.id)}
                >
                  <div className="department-icon">{dept.icon}</div>
                  <div className="department-name">{dept.name}</div>
                  <div className="department-desc">{dept.description}</div>
                  <span className="prob-indicator">匹配度: {dept.probability}%</span>
                </Card>
              ))}
            </div>
            
            <div className="result-section">
              <div className="result-header">
                <div className="result-title">疾病可能性分析</div>
                <Tooltip title="查看详细报告">
                  <div className="result-action">查看更多</div>
                </Tooltip>
                                    </div>
              
              <div className="analysis-content">
                <div className="form-group">
                  <div className="form-label">可能的情况：</div>
                  <ul>
                    {possibleDiseases.map((disease, index) => (
                      <li key={index}>{disease.name}</li>
                    ))}
                  </ul>
                </div>

                <div className="form-group">
                  <div className="form-label">建议检查项目：</div>
                  <ul>
                    {recommendedTests.map((test, index) => (
                      <li key={index}>{test.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="disclaimer">
                <ExclamationCircleOutlined className="disclaimer-icon" />
                <span className="disclaimer-text">
                  免责声明：此导诊结果仅供参考，不构成医疗诊断。请遵循医生的专业建议进行诊断和治疗。
                </span>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="step-content">
            <div className="form-title">预约就诊</div>
            
            <Form layout="vertical">
              <Form.Item
                label="选择医院"
                required
              >
                <Radio.Group defaultValue="hospital1">
                  <div className="radio-group vertical">
                    <Radio value="hospital1">协和医院</Radio>
                    <Radio value="hospital2">同济医院</Radio>
                    <Radio value="hospital3">华山医院</Radio>
                  </div>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                label="预约时间"
                required
              >
                <Radio.Group defaultValue="time1">
                  <div className="radio-group vertical">
                    <Radio value="time1">明天上午 9:00-10:00</Radio>
                    <Radio value="time2">明天下午 14:00-15:00</Radio>
                    <Radio value="time3">后天上午 10:00-11:00</Radio>
                    <Radio value="time4">后天下午 15:00-16:00</Radio>
                  </div>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                label="备注信息"
              >
                <TextArea
                  rows={3}
                  placeholder="添加您的其他需求或说明"
                />
              </Form.Item>
            </Form>
            
            <div className="disclaimer">
              <ExclamationCircleOutlined className="disclaimer-icon" />
              <span className="disclaimer-text">
                请在就诊前准备好您的医保卡、身份证等证件，提前15分钟到达医院。
              </span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout className="guidance-page">
      <Header className="header">
        <div className="logo">
          <img 
            src="/logo.png" 
            alt="Logo" 
            onError={(e) => {
              e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png';
            }}
          />
          智慧医疗
                        </div>
        <div className="user-menu">
          <Avatar 
            icon={<UserOutlined />} 
            className="avatar"
          >
            {getAvatarText()}
          </Avatar>
          <span className="username">{user?.name || '用户'}</span>
                        </div>
      </Header>
      
      <Content className="main-container">
        <div className="guidance-container">
          <div className="guidance-header">
            <div className="guidance-title">智能导诊</div>
            <div className="guidance-subtitle">根据您的症状，我们将为您推荐合适的科室</div>
                        </div>
          
          <div className="guidance-body">
            <Steps
              className="step-indicator"
              current={currentStep}
              items={[
                {
                  title: '症状描述',
                },
                {
                  title: '科室推荐',
                },
                {
                  title: '就诊预约',
                }
              ]}
            />
            
            {renderStepContent()}
            
            <div className="form-actions">
              {currentStep > 0 ? (
                <Button 
                  className="btn-outline" 
                  onClick={currentStep === 0 ? handleReturn : handlePrev}
                  icon={<ArrowLeftOutlined />}
                >
                  {currentStep === 0 ? '返回' : '上一步'}
                </Button>
              ) : (
                <Button 
                  className="btn-outline" 
                  onClick={handleReturn}
                >
                  返回
                </Button>
              )}
              
              {currentStep < 2 ? (
                <Button 
                  type="primary"
                  className="btn-primary" 
                  onClick={handleNext}
                >
                  下一步 <ArrowRightOutlined />
                </Button>
              ) : (
                <Button 
                  type="primary"
                  className="btn-primary" 
                  onClick={handleSubmit}
                >
                  确认预约
                </Button>
                )}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
    );
};

export default GuidePage;
