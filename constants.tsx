

import React from 'react';
import { ResourceType } from './types';
import { BookIcon, FlashcardIcon, NotesIcon, QAIcon, ActivityIcon, ExtraIcon, VideoIcon, AudioIcon, WorksheetIcon, QuestionPaperIcon, QuizIcon, SlideIcon } from './components/icons/ResourceTypeIcons';

interface ResourceInfo {
  key: ResourceType;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

export const RESOURCE_TYPES: ResourceInfo[] = [
  { key: 'book', label: 'Book', Icon: BookIcon },
  { key: 'slide', label: 'Slides', Icon: SlideIcon },
  { key: 'flashcard', label: 'Flashcard', Icon: FlashcardIcon },
  { key: 'notes', label: 'Notes', Icon: NotesIcon },
  { key: 'qa', label: 'Q&A', Icon: QAIcon },
  { key: 'quiz', label: 'Quiz', Icon: QuizIcon },
  { key: 'activity', label: 'Bookback Activity', Icon: ActivityIcon },
  { key: 'extra', label: 'More Activity', Icon: ExtraIcon },
  { key: 'video', label: 'Video', Icon: VideoIcon },
  { key: 'audio', label: 'Audio', Icon: AudioIcon },
  { key: 'worksheet', label: 'Worksheet', Icon: WorksheetIcon },
  { key: 'questionPaper', label: 'Question Papers', Icon: QuestionPaperIcon },
];