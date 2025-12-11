import React, { useEffect } from 'react';
import { ResourceType, User } from '../types';
import { BookView } from './content_views/BookView';
import { SlideView } from './content_views/SlideView';
import { WorksheetView } from './content_views/WorksheetView';
import { NotesView } from './content_views/NotesView';
import { QAView } from './content_views/QAView';
import { FlashcardView } from './content_views/FlashcardView';
import { GenericContentView } from './content_views/GenericContentView';
import { VideoView } from './content_views/VideoView';
import { AudioView } from './content_views/AudioView';
import { QuizView } from './content_views/QuizView';
import { QuestionPaperView } from './content_views/QuestionPaperView';

interface ContentDisplayProps {
  lessonId: string | null;
  selectedResourceType: ResourceType | null;
  user: User;
}

const WelcomeMessage: React.FC<{ message: string; subMessage: string }> = ({ message, subMessage }) => (
    <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
        <div className="p-8 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
            <h2 className="text-xl font-medium">{message}</h2>
            <p className="mt-2 text-sm">{subMessage}</p>
        </div>
    </div>
);

export const ContentDisplay: React.FC<ContentDisplayProps> = ({ lessonId, selectedResourceType, user }) => {
  // Debug logging to track prop changes
  useEffect(() => {
    console.log('[ContentDisplay] Props changed:', { lessonId, selectedResourceType });
  }, [lessonId, selectedResourceType]);
  
  if (!lessonId) {
    return <WelcomeMessage message="Select a chapter to begin" subMessage="Use the selectors at the top to navigate to a chapter." />;
  }

  if (!selectedResourceType) {
    return <WelcomeMessage message="Select a resource" subMessage="Choose a resource type from the sidebar to view its content." />;
  }
  
  const renderContent = () => {
    switch (selectedResourceType) {
        case 'book':
          return <BookView lessonId={lessonId} user={user} />;
        case 'worksheet':
          return <WorksheetView lessonId={lessonId} user={user} />;
        case 'notes':
            return <NotesView lessonId={lessonId} user={user} />;
        case 'qa':
            return <QAView lessonId={lessonId} user={user} />;
        case 'flashcard':
            return <FlashcardView lessonId={lessonId} user={user} />;
        case 'video':
            return <VideoView lessonId={lessonId} user={user} />;
        case 'audio':
            return <AudioView lessonId={lessonId} user={user} />;
        case 'quiz':
            return <QuizView lessonId={lessonId} user={user} />;
        case 'questionPaper':
            return <QuestionPaperView lessonId={lessonId} user={user} />;
        case 'slide':
            return <SlideView lessonId={lessonId} user={user} />;
        case 'activity':
        case 'extra':
            return <GenericContentView lessonId={lessonId} user={user} resourceType={selectedResourceType} />;
        default:
          return <WelcomeMessage message="Unknown resource type" subMessage="This resource type is not supported." />;
      }
  }

  return (
      <div className="h-full overflow-hidden">
          {renderContent()}
      </div>
  );
};