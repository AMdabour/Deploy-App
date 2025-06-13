import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target, Calendar, FileText, Save } from 'lucide-react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../ui/Modal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import MessageDisplay from '../../ui/MessageDisplay';
import {
  KeyResultFormData,
  ObjectiveFormData,
} from '../../../types/objectives';

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ObjectiveFormData) => void;
  goals: Array<{ id: string; title: string; category: string }>;
  objective?: {
    id: string;
    goalId: string;
    title: string;
    description: string;
    targetMonth: number;
    targetYear: number;
    keyResults: Array<{
      id: string;
      description: string;
      targetValue?: number;
      currentValue?: number;
      unit?: string;
      completed: boolean;
    }>;
  } | null;
  loading?: boolean;
}

const ObjectiveModal: React.FC<ObjectiveModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  goals,
  objective,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ObjectiveFormData>({
    goalId: '',
    title: '',
    description: '',
    targetMonth: new Date().getMonth() + 1,
    targetYear: new Date().getFullYear(),
    keyResults: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Reset form when modal opens/closes or objective changes
  useEffect(() => {
    if (isOpen) {
      if (objective) {
        setFormData({
          goalId: objective.goalId,
          title: objective.title,
          description: objective.description,
          targetMonth: objective.targetMonth,
          targetYear: objective.targetYear,
          keyResults: objective.keyResults.map((kr) => ({
            id: kr.id,
            description: kr.description,
            targetValue: kr.targetValue,
            currentValue: kr.currentValue,
            unit: kr.unit,
            completed: kr.completed,
          })),
        });
      } else {
        setFormData({
          goalId: '',
          title: '',
          description: '',
          targetMonth: new Date().getMonth() + 1,
          targetYear: new Date().getFullYear(),
          keyResults: [],
        });
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, objective]);

  const handleInputChange = (field: keyof ObjectiveFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string) => {
    return touched[field] ? errors[field] : undefined;
  };

  const addKeyResult = () => {
    setFormData((prev) => ({
      ...prev,
      keyResults: [
        ...prev.keyResults,
        {
          description: '',
          targetValue: undefined,
          unit: '',
          currentValue: 0,
          completed: false,
        },
      ],
    }));
  };

  const updateKeyResult = (
    index: number,
    field: keyof KeyResultFormData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, i) =>
        i === index ? { ...kr, [field]: value } : kr
      ),
    }));
  };

  const removeKeyResult = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== index),
    }));
  };

  // Fixed: Return validation result without setting state
  const getValidationErrors = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.goalId) newErrors.goalId = 'Goal is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.targetMonth < 1 || formData.targetMonth > 12) {
      newErrors.targetMonth = 'Month must be between 1 and 12';
    }
    if (formData.targetYear < new Date().getFullYear()) {
      newErrors.targetYear = 'Year cannot be in the past';
    }

    // Validate key results
    formData.keyResults.forEach((kr, index) => {
      if (!kr.description.trim()) {
        newErrors[`keyResult_${index}_description`] = 'Description is required';
      }
      if (kr.targetValue !== undefined && kr.targetValue <= 0) {
        newErrors[`keyResult_${index}_targetValue`] =
          'Target value must be positive';
      }
    });

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = ['goalId', 'title', 'targetMonth', 'targetYear'];
    setTouched(
      allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

    // Get validation errors and set them
    const validationErrors = getValidationErrors();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  // Fixed: Check form validity without causing re-renders
  const isFormValid = formData.title.trim() && formData.goalId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      {/* Header */}
      <ModalHeader
        title={objective ? 'Edit Objective' : 'Create New Objective'}
        subtitle="Define your monthly objective with measurable key results"
        icon={<Target className="w-6 h-6 text-white" />}
        onClose={onClose}
      />

      {/* Body */}
      <ModalBody className="max-h-[70vh]">
        <form id="objective-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Selection */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Goal <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.goalId}
              onChange={(e) => handleInputChange('goalId', e.target.value)}
              onBlur={() => handleBlur('goalId')}
              className={`w-full bg-background/60 border rounded-lg px-4 py-3 focus:ring-2 transition-all duration-300 ${
                getFieldError('goalId')
                  ? 'border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20'
                  : 'border-border/50 focus:border-primary focus:ring-primary/20'
              }`}
            >
              <option value="">Select a goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title} ({goal.category})
                </option>
              ))}
            </select>
            {getFieldError('goalId') && (
              <p className="mt-2 text-sm text-destructive">
                {getFieldError('goalId')}
              </p>
            )}
          </div>

          {/* Title */}
          <Input
            label="Objective Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            placeholder="e.g., Complete Python Fundamentals"
            error={getFieldError('title')}
            helperText="* Required field"
            leftIcon={<Target className="w-4 h-4" />}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this objective aims to achieve..."
              rows={3}
              className="w-full bg-background/60 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Target Month & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Target Month <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.targetMonth}
                onChange={(e) =>
                  handleInputChange('targetMonth', parseInt(e.target.value))
                }
                onBlur={() => handleBlur('targetMonth')}
                className={`w-full bg-background/60 border rounded-lg px-4 py-3 focus:ring-2 transition-all duration-300 ${
                  getFieldError('targetMonth')
                    ? 'border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20'
                    : 'border-border/50 focus:border-primary focus:ring-primary/20'
                }`}
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              {getFieldError('targetMonth') && (
                <p className="mt-2 text-sm text-destructive">
                  {getFieldError('targetMonth')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Target Year <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.targetYear}
                onChange={(e) =>
                  handleInputChange('targetYear', parseInt(e.target.value))
                }
                onBlur={() => handleBlur('targetYear')}
                className={`w-full bg-background/60 border rounded-lg px-4 py-3 focus:ring-2 transition-all duration-300 ${
                  getFieldError('targetYear')
                    ? 'border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20'
                    : 'border-border/50 focus:border-primary focus:ring-primary/20'
                }`}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {getFieldError('targetYear') && (
                <p className="mt-2 text-sm text-destructive">
                  {getFieldError('targetYear')}
                </p>
              )}
            </div>
          </div>

          {/* Key Results Section */}
          <div className="border-t border-border/30 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Key Results
                {formData.keyResults.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {formData.keyResults.length}
                  </span>
                )}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth={false}
                onClick={addKeyResult}
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Key Result
              </Button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {formData.keyResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/5">
                  <Target className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <h4 className="font-medium mb-2">No key results yet</h4>
                  <p className="text-sm mb-4">
                    Add measurable key results to track your objective's
                    progress
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    onClick={addKeyResult}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Key Result
                  </Button>
                </div>
              ) : (
                <>
                  {formData.keyResults.map((keyResult, index) => (
                    <div
                      key={index}
                      className="group p-4 bg-muted/20 hover:bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        {/* Key Result Number */}
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium mt-1">
                          {index + 1}
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Description */}
                          <div>
                            <input
                              type="text"
                              value={keyResult.description}
                              onChange={(e) =>
                                updateKeyResult(
                                  index,
                                  'description',
                                  e.target.value
                                )
                              }
                              placeholder="e.g., Complete 10 Python exercises"
                              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                            />
                            {errors[`keyResult_${index}_description`] && (
                              <p className="text-xs text-destructive mt-1">
                                {errors[`keyResult_${index}_description`]}
                              </p>
                            )}
                          </div>

                          {/* Target Value & Unit */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <input
                                type="number"
                                value={keyResult.targetValue || ''}
                                onChange={(e) =>
                                  updateKeyResult(
                                    index,
                                    'targetValue',
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                                placeholder="Target value (optional)"
                                min="1"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                              />
                              {errors[`keyResult_${index}_targetValue`] && (
                                <p className="text-xs text-destructive mt-1">
                                  {errors[`keyResult_${index}_targetValue`]}
                                </p>
                              )}
                            </div>
                            <input
                              type="text"
                              value={keyResult.unit || ''}
                              onChange={(e) =>
                                updateKeyResult(index, 'unit', e.target.value)
                              }
                              placeholder="Unit (e.g., hours, pages, tasks)"
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeKeyResult(index)}
                          className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="Remove key result"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Key Results Helper */}
                  <div className="bg-info/5 border border-info/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-info/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-info text-xs">💡</span>
                      </div>
                      <div className="text-sm text-info/80">
                        <p className="font-medium mb-1">Key Results Tips:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Make them specific and measurable</li>
                          <li>• Add target values when possible</li>
                          <li>
                            • Use clear units (hours, pages, completed tasks)
                          </li>
                          <li>
                            • Keep them achievable within the target month
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </ModalBody>

      {/* Footer */}
      <ModalFooter>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            size="lg"
            fullWidth={false}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            loading={loading}
            fullWidth={false}
            className="min-w-[160px] shadow-xl"
            form="objective-form"
            disabled={!isFormValid}
          >
            <Save className="w-5 h-5 mr-2" />
            {objective ? 'Update Objective' : 'Create Objective'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ObjectiveModal;
