import React, { useState } from 'react';
import { XProvider, Prompts } from '@ant-design/x';
import { Typography, Card, Avatar, List, Input, Button } from 'antd';
import { BookOutlined, SearchOutlined, RightOutlined } from '@ant-design/icons';

// 类型定义
interface Department {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

interface Symptom {
    id: string;
    name: string;
}

const GuidePage: React.FC = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [searchValue, setSearchValue] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Symptom[]>([]);

    // 科室数据
    const departments: Department[] = [
        { id: 'internal', name: '内科', description: '处理内脏疾病', icon: <BookOutlined /> },
        { id: 'surgery', name: '外科', description: '处理需要手术的疾病', icon: <BookOutlined /> },
        {
            id: 'gynecology',
            name: '妇产科',
            description: '处理女性生殖系统疾病',
            icon: <BookOutlined />,
        },
        { id: 'pediatrics', name: '儿科', description: '处理儿童疾病', icon: <BookOutlined /> },
        {
            id: 'dermatology',
            name: '皮肤科',
            description: '处理皮肤相关疾病',
            icon: <BookOutlined />,
        },
        {
            id: 'psychology',
            name: '心理科',
            description: '处理心理健康问题',
            icon: <BookOutlined />,
        },
        { id: 'tcm', name: '中医科', description: '提供传统中医治疗', icon: <BookOutlined /> },
        { id: 'ophthalmology', name: '眼科', description: '处理眼部疾病', icon: <BookOutlined /> },
    ];

    const handleDepartmentSelect = (id: string) => {
        const dept = departments.find(d => d.id === id);
        if (dept) {
            setSelectedDepartment(dept);
        }
    };

    const handleSearch = (value: string) => {
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }

        // 模拟搜索结果
        setTimeout(() => {
            const results: Symptom[] = [
                { id: 's1', name: '头痛' },
                { id: 's2', name: '发热' },
                { id: 's3', name: '咳嗽' },
                { id: 's4', name: '腹痛' },
            ].filter(item => item.name.includes(value));

            setSearchResults(results);
        }, 300);
    };

    return (
        <XProvider>
            <div className="guide-page">
                <Typography.Title level={4}>医院导诊助手</Typography.Title>

                <div className="search-section">
                    <Input.Search
                        placeholder="请输入症状或疾病名称"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        onSearch={handleSearch}
                        enterButton={<SearchOutlined />}
                    />

                    {searchResults.length > 0 && (
                        <List
                            className="search-results"
                            size="small"
                            bordered
                            dataSource={searchResults}
                            renderItem={item => (
                                <List.Item>
                                    <div className="symptom-item">
                                        {item.name}
                                        <span className="recommendation">建议就诊: 内科</span>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </div>

                <div className="department-section">
                    <Typography.Title level={5}>选择科室</Typography.Title>

                    <Prompts
                        items={departments.map(dept => ({
                            key: dept.id,
                            id: dept.id,
                            content: dept.name,
                            onClick: () => handleDepartmentSelect(dept.id),
                        }))}
                        title="常见科室"
                    />
                </div>

                {selectedDepartment && (
                    <Card className="department-detail">
                        <div className="department-header">
                            <Avatar icon={selectedDepartment.icon} />
                            <Typography.Title level={5}>{selectedDepartment.name}</Typography.Title>
                        </div>
                        <div className="department-description">
                            {selectedDepartment.description}
                        </div>
                        <div className="common-diseases">
                            <Typography.Title level={5}>常见疾病</Typography.Title>
                            <ul>
                                <li>
                                    病症示例1 <RightOutlined />
                                </li>
                                <li>
                                    病症示例2 <RightOutlined />
                                </li>
                                <li>
                                    病症示例3 <RightOutlined />
                                </li>
                            </ul>
                        </div>
                        <Button type="primary">在线问诊此科室</Button>
                    </Card>
                )}
            </div>
        </XProvider>
    );
};

export default GuidePage;
