import React, { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { Class, Subject, Unit, SubUnit, Lesson } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './icons/AdminIcons';
import { ConfirmModal } from './ConfirmModal';

type Item = { _id: string; name: string };
type Level = 'class' | 'subject' | 'unit' | 'subUnit' | 'lesson';

const ManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  itemToEdit: Item | null;
  level: Level | null;
}> = ({ isOpen, onClose, onSave, itemToEdit, level }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
    } else {
      setName('');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSaving) {
      setIsSaving(true);
      await onSave(name.trim());
      setIsSaving(false);
    }
  };
  
  const levelName = {
      class: 'Class',
      subject: 'Subject',
      unit: 'Unit',
      subUnit: 'Sub-Unit',
      lesson: 'Chapter'
  }[level || 'class'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{itemToEdit ? `Edit ${levelName}` : `Add New ${levelName}`}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`${levelName} Name`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            autoFocus
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50" disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait" disabled={isSaving}>
              {isSaving ? 'Saving...' : (itemToEdit ? 'Save Changes' : `Create ${levelName}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManagementColumn: React.FC<{
    title: string;
    items: Item[] | null;
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
    addDisabled?: boolean;
}> = ({ title, items, isLoading, selectedId, onSelect, onAdd, onEdit, onDelete, addDisabled = false }) => (
    <div className="bg-white dark:bg-gray-800/50 shadow-md rounded-lg flex flex-col h-[calc(100vh-14rem)] min-h-[300px]">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{title}</h2>
            <button
                onClick={onAdd}
                disabled={addDisabled}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={`Add New ${title.slice(0, -1)}`}
            >
                <PlusIcon className="w-3 h-3" />
                <span>Add</span>
            </button>
        </div>
        <div className="overflow-y-auto flex-1">
            {isLoading && <div className="p-4 text-center text-gray-500 text-xs">Loading...</div>}
            {!isLoading && items?.length === 0 && <div className="p-4 text-center text-xs text-gray-500">No items found.</div>}
            {items?.map(item => (
                <div 
                    key={item._id}
                    onClick={() => onSelect(item._id)}
                    className={`group flex justify-between items-center p-2.5 text-sm cursor-pointer border-l-4 ${selectedId === item._id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                >
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{item.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(item._id); }} className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


export const ClassManagement: React.FC = () => {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [selectedSubUnitId, setSelectedSubUnitId] = useState<string | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    const [modalState, setModalState] = useState<{ isOpen: boolean; level: Level | null; itemToEdit: Item | null }>({ isOpen: false, level: null, itemToEdit: null });
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });

    const [classVersion, setClassVersion] = useState(0);
    const [subjectVersion, setSubjectVersion] = useState(0);
    const [unitVersion, setUnitVersion] = useState(0);
    const [subUnitVersion, setSubUnitVersion] = useState(0);
    const [lessonVersion, setLessonVersion] = useState(0);

    const { data: classes, isLoading: isLoadingClasses } = useApi<Class[]>(api.getClasses, [classVersion]);
    const { data: subjects, isLoading: isLoadingSubjects } = useApi<Subject[]>(() => api.getSubjectsByClassId(selectedClassId!), [selectedClassId, subjectVersion], !!selectedClassId);
    const { data: units, isLoading: isLoadingUnits } = useApi<Unit[]>(() => api.getUnitsBySubjectId(selectedSubjectId!), [selectedSubjectId, unitVersion], !!selectedSubjectId);
    const { data: subUnits, isLoading: isLoadingSubUnits } = useApi<SubUnit[]>(() => api.getSubUnitsByUnitId(selectedUnitId!), [selectedUnitId, subUnitVersion], !!selectedUnitId);
    const { data: lessons, isLoading: isLoadingLessons } = useApi<Lesson[]>(() => api.getLessonsBySubUnitId(selectedSubUnitId!), [selectedSubUnitId, lessonVersion], !!selectedSubUnitId);

    const openModal = (level: Level, itemToEdit: Item | null = null) => setModalState({ isOpen: true, level, itemToEdit });
    const closeModal = () => setModalState({ isOpen: false, level: null, itemToEdit: null });

    const openConfirmModal = (onConfirm: () => void) => {
        setConfirmModalState({ isOpen: true, onConfirm });
    };

    const closeConfirmModal = () => {
        setConfirmModalState({ isOpen: false, onConfirm: null });
    };

    const handleSelect = useCallback((level: Level, id: string | null) => {
        switch (level) {
            case 'class':
                setSelectedClassId(id);
                setSelectedSubjectId(null);
                setSelectedUnitId(null);
                setSelectedSubUnitId(null);
                setSelectedLessonId(null);
                break;
            case 'subject':
                setSelectedSubjectId(id);
                setSelectedUnitId(null);
                setSelectedSubUnitId(null);
                setSelectedLessonId(null);
                break;
            case 'unit':
                setSelectedUnitId(id);
                setSelectedSubUnitId(null);
                setSelectedLessonId(null);
                break;
            case 'subUnit':
                setSelectedSubUnitId(id);
                setSelectedLessonId(null);
                break;
            case 'lesson':
                setSelectedLessonId(id);
                break;
        }
    }, []);

    const handleDelete = (level: Level, id: string) => {
        const confirmAction = async () => {
            switch (level) {
                case 'class':
                    await api.deleteClass(id);
                    setClassVersion(v => v + 1);
                    if (selectedClassId === id) handleSelect('class', null);
                    break;
                case 'subject':
                    await api.deleteSubject(id);
                    setSubjectVersion(v => v + 1);
                    if (selectedSubjectId === id) handleSelect('subject', null);
                    break;
                case 'unit':
                    await api.deleteUnit(id);
                    setUnitVersion(v => v + 1);
                    if (selectedUnitId === id) handleSelect('unit', null);
                    break;
                case 'subUnit':
                    await api.deleteSubUnit(id);
                    setSubUnitVersion(v => v + 1);
                    if (selectedSubUnitId === id) handleSelect('subUnit', null);
                    break;
                case 'lesson':
                    await api.deleteLesson(id);
                    setLessonVersion(v => v + 1);
                    if (selectedLessonId === id) handleSelect('lesson', null);
                    break;
            }
            closeConfirmModal();
        };
        openConfirmModal(confirmAction);
    };

    const handleSave = async (name: string) => {
        const { level, itemToEdit } = modalState;
        switch (level) {
            case 'class':
                if (itemToEdit) {
                    await api.updateClass(itemToEdit._id, name);
                } else {
                    await api.addClass(name);
                }
                setClassVersion(v => v + 1);
                break;
            case 'subject':
                if (itemToEdit) {
                    await api.updateSubject(itemToEdit._id, name);
                } else if(selectedClassId) {
                    await api.addSubject(name, selectedClassId);
                }
                setSubjectVersion(v => v + 1);
                break;
            case 'unit':
                if (itemToEdit) {
                    await api.updateUnit(itemToEdit._id, name);
                } else if (selectedSubjectId) {
                    await api.addUnit(name, selectedSubjectId);
                }
                setUnitVersion(v => v + 1);
                break;
            case 'subUnit':
                 if (itemToEdit) {
                    await api.updateSubUnit(itemToEdit._id, name);
                } else if(selectedUnitId) {
                    await api.addSubUnit(name, selectedUnitId);
                }
                setSubUnitVersion(v => v + 1);
                break;
            case 'lesson':
                 if (itemToEdit) {
                    await api.updateLesson(itemToEdit._id, name);
                } else if(selectedSubUnitId) {
                    await api.addLesson(name, selectedSubUnitId);
                }
                setLessonVersion(v => v + 1);
                break;
        }
        closeModal();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">Course Structure Management</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1">
                <ManagementColumn 
                    title="Classes"
                    items={classes}
                    isLoading={isLoadingClasses}
                    selectedId={selectedClassId}
                    onSelect={(id) => handleSelect('class', id)}
                    onAdd={() => openModal('class')}
                    onEdit={(item) => openModal('class', item)}
                    onDelete={(id) => handleDelete('class', id)}
                />
                 <ManagementColumn 
                    title="Subjects"
                    items={subjects}
                    isLoading={isLoadingSubjects}
                    selectedId={selectedSubjectId}
                    onSelect={(id) => handleSelect('subject', id)}
                    onAdd={() => openModal('subject')}
                    onEdit={(item) => openModal('subject', item)}
                    onDelete={(id) => handleDelete('subject', id)}
                    addDisabled={!selectedClassId}
                />
                <ManagementColumn 
                    title="Units"
                    items={units}
                    isLoading={isLoadingUnits}
                    selectedId={selectedUnitId}
                    onSelect={(id) => handleSelect('unit', id)}
                    onAdd={() => openModal('unit')}
                    onEdit={(item) => openModal('unit', item)}
                    onDelete={(id) => handleDelete('unit', id)}
                    addDisabled={!selectedSubjectId}
                />
                <ManagementColumn 
                    title="Sub-Units"
                    items={subUnits}
                    isLoading={isLoadingSubUnits}
                    selectedId={selectedSubUnitId}
                    onSelect={(id) => handleSelect('subUnit', id)}
                    onAdd={() => openModal('subUnit')}
                    onEdit={(item) => openModal('subUnit', item)}
                    onDelete={(id) => handleDelete('subUnit', id)}
                    addDisabled={!selectedUnitId}
                />
                <ManagementColumn 
                    title="Chapters"
                    items={lessons}
                    isLoading={isLoadingLessons}
                    selectedId={selectedLessonId}
                    onSelect={(id) => handleSelect('lesson', id)}
                    onAdd={() => openModal('lesson')}
                    onEdit={(item) => openModal('lesson', item)}
                    onDelete={(id) => handleDelete('lesson', id)}
                    addDisabled={!selectedSubUnitId}
                />
            </div>
             <ManagementModal 
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onSave={handleSave}
                itemToEdit={modalState.itemToEdit}
                level={modalState.level}
            />
            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModalState.onConfirm}
                title="Confirm Deletion"
                message="Are you sure you want to delete this item and all its contents? This action cannot be undone."
            />
        </div>
    );
};