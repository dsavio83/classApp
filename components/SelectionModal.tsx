import React, { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { getClasses, getSubjectsByClassId, getUnitsBySubjectId, getSubUnitsByUnitId, getLessonsBySubUnitId } from '../services/api';
import { Class, Subject, Unit, SubUnit, Lesson } from '../types';
import { XIcon } from './icons/AdminIcons';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | null;
  subjectId: string | null;
  unitId: string | null;
  subUnitId: string | null;
  lessonId: string | null;
  onClassChange: (id: string | null) => void;
  onSubjectChange: (id: string | null) => void;
  onUnitChange: (id: string | null) => void;
  onSubUnitChange: (id: string | null) => void;
  onLessonChange: (id: string | null) => void;
  onSave: () => void;
  defaultClass?: string;
}

const Selector: React.FC<{
  label: string;
  value: string | null;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { _id: string; name: string }[] | null;
  isLoading: boolean;
  disabled: boolean;
}> = ({ label, value, onChange, options, isLoading, disabled }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
    <div className="relative">
      <select
        value={value || ''}
        onChange={onChange}
        disabled={disabled || isLoading}
        className="w-full px-4 py-3 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
      >
        <option value="" disabled>{isLoading ? 'Loading...' : `Select ${label}`}</option>
        {options?.map(opt => (
          <option key={opt._id} value={opt._id}>{opt.name}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

export const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  classId,
  subjectId,
  unitId,
  subUnitId,
  lessonId,
  onClassChange,
  onSubjectChange,
  onUnitChange,
  onSubUnitChange,
  onLessonChange,
  onSave,
  defaultClass
}) => {
  const { data: classes, isLoading: isLoadingClasses } = useApi<Class[]>(getClasses, []);
  const { data: subjects, isLoading: isLoadingSubjects } = useApi<Subject[]>(
    () => getSubjectsByClassId(classId!),
    [classId],
    !!classId
  );
  const { data: units, isLoading: isLoadingUnits } = useApi<Unit[]>(
    () => getUnitsBySubjectId(subjectId!),
    [subjectId],
    !!subjectId
  );
  const { data: subUnits, isLoading: isLoadingSubUnits } = useApi<SubUnit[]>(
    () => getSubUnitsByUnitId(unitId!),
    [unitId],
    !!unitId
  );
  const { data: lessons, isLoading: isLoadingLessons } = useApi<Lesson[]>(
    () => getLessonsBySubUnitId(subUnitId!),
    [subUnitId],
    !!subUnitId
  );

  // Set default class to "8" on first load
  useEffect(() => {
    if (isOpen && classes && classes.length > 0 && !classId && defaultClass) {
      const defaultClassObj = classes.find(c => 
        c.name.toLowerCase().includes(defaultClass.toLowerCase()) || 
        c._id === defaultClass
      );
      if (defaultClassObj) {
        onClassChange(defaultClassObj._id);
      }
    }
  }, [isOpen, classes, classId, defaultClass, onClassChange]);

  const handleSave = () => {
    onSave();
    onClose();
  };

  const hasSelections = classId || subjectId || unitId || subUnitId || lessonId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Options
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Selection Form */}
          <div className="space-y-6">
            {/* Class Selector */}
            <Selector
              label="Class"
              value={classId}
              onChange={(e) => onClassChange(e.target.value || null)}
              options={classes}
              isLoading={isLoadingClasses}
              disabled={false}
            />

            {/* Subject Selector */}
            {classId && (
              <Selector
                label="Subject"
                value={subjectId}
                onChange={(e) => onSubjectChange(e.target.value || null)}
                options={subjects}
                isLoading={isLoadingSubjects}
                disabled={!classId}
              />
            )}

            {/* Unit Selector */}
            {subjectId && (
              <Selector
                label="Unit"
                value={unitId}
                onChange={(e) => onUnitChange(e.target.value || null)}
                options={units}
                isLoading={isLoadingUnits}
                disabled={!subjectId}
              />
            )}

            {/* Sub-Unit Selector */}
            {unitId && (isLoadingSubUnits || (subUnits && subUnits.length > 0)) && (
              <Selector
                label="Sub-Unit"
                value={subUnitId}
                onChange={(e) => onSubUnitChange(e.target.value || null)}
                options={subUnits}
                isLoading={isLoadingSubUnits}
                disabled={!unitId}
              />
            )}

            {/* Chapter Selector */}
            {subUnitId && (isLoadingLessons || (lessons && lessons.length > 0)) && (
              <Selector
                label="Chapter"
                value={lessonId}
                onChange={(e) => onLessonChange(e.target.value || null)}
                options={lessons}
                isLoading={isLoadingLessons}
                disabled={!subUnitId}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasSelections}
            >
              Save Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};