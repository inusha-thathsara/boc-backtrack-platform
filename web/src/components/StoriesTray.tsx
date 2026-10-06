import React from 'react';
import { CreatorStoryGroup, User } from '../services/api';
import { Plus } from 'lucide-react';

interface StoriesTrayProps {
  currentUser: User;
  storyGroups: CreatorStoryGroup[];
  onSelectStoryGroup: (group: CreatorStoryGroup) => void;
  onAddStoryClick: () => void;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({
  currentUser,
  storyGroups,
  onSelectStoryGroup,
  onAddStoryClick,
}) => {
  return (
    <div className="stories-tray-container">
      <div className="stories-track">
        {/* Current User Story Item (Add Story) */}
        <button className="story-item" onClick={onAddStoryClick}>
          <div className="story-ring story-add-ring">
            <img src={currentUser.avatarUrl} alt={currentUser.username} className="story-avatar" />
            <div className="story-add-badge">
              <Plus size={14} strokeWidth={3} />
            </div>
          </div>
          <span className="story-username">Your Story</span>
        </button>

        {/* Active Stories from other Creators */}
        {storyGroups.map(group => (
          <button
            key={group.user.id}
            className="story-item"
            onClick={() => onSelectStoryGroup(group)}
          >
            <div className="story-ring">
              <img src={group.user.avatarUrl} alt={group.user.username} className="story-avatar" />
            </div>
            <span className="story-username">{group.user.username}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
