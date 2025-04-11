import React from 'react';
import './UserCard.css';

interface UserCardProps {
  name: string;
  age: number;
  gender: string;
  phone: string;
  id: string;
}

const UserCard: React.FC<UserCardProps> = ({ name, age, gender, phone, id }) => {
  return (
    <div className="user-card">
      <div className="user-info-header">
        <div className="user-basic-info">
          <span className="user-name">{name}</span>
          <span className="user-details">{`${age}岁 ${gender}`}</span>
        </div>
      </div>
      <div className="user-contact-info">
        <div className="info-item">
          <span className="info-label">电话：</span>
          <span className="info-value">{phone}</span>
        </div>
        <div className="info-item">
          <span className="info-label">ID：</span>
          <span className="info-value">{id}</span>
        </div>
      </div>
    </div>
  );
};

export default UserCard;