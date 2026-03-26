// ═══════════════════════════════════════════════════════════════════
// FitForge — TrainerEnrollmentForm Component
// Multi-section form for enrolling as a personal trainer
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SPEC_LABELS, SPEC_COLORS } from '@/components/trainer/TrainerCard';
import type { TrainerSpecialization, TrainerCertification } from '@/types';

const ALL_SPECIALIZATIONS: TrainerSpecialization[] = [
  'strength', 'cardio', 'flexibility', 'weight_loss', 'bodybuilding',
  'powerlifting', 'rehabilitation', 'sports_performance', 'general_fitness',
];

export interface TrainerEnrollmentFormProps {
  defaultName?: string;
  onSubmit: (data: {
    displayName: string;
    bio: string;
    specializations: TrainerSpecialization[];
    certifications: TrainerCertification[];
    experienceYears: number;
  }) => void;
  isSubmitting?: boolean;
}

export function TrainerEnrollmentForm({
  defaultName = '',
  onSubmit,
  isSubmitting = false,
}: TrainerEnrollmentFormProps): React.ReactElement {
  const [displayName, setDisplayName] = useState(defaultName);
  const [bio, setBio] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<TrainerSpecialization[]>([]);
  const [certifications, setCertifications] = useState<TrainerCertification[]>([]);
  const [experienceYears, setExperienceYears] = useState(1);

  const toggleSpec = (spec: TrainerSpecialization): void => {
    setSelectedSpecs((prev) => {
      if (prev.includes(spec)) return prev.filter((s) => s !== spec);
      if (prev.length >= 3) return prev;
      return [...prev, spec];
    });
  };

  const addCertification = (): void => {
    setCertifications((prev) => [
      ...prev,
      { name: '', issuedBy: '', year: new Date().getFullYear() },
    ]);
  };

  const updateCert = (index: number, field: keyof TrainerCertification, value: string | number): void => {
    setCertifications((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const removeCert = (index: number): void => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    displayName.trim().length > 0 &&
    bio.trim().length > 0 &&
    bio.trim().length <= 500 &&
    selectedSpecs.length >= 1 &&
    !isSubmitting;

  const handleSubmit = (): void => {
    if (!canSubmit) return;
    onSubmit({
      displayName: displayName.trim(),
      bio: bio.trim(),
      specializations: selectedSpecs,
      certifications: certifications.filter((c) => c.name.trim().length > 0),
      experienceYears,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Display Name */}
      <FormSection label="Display Name">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={100}
          placeholder="Your name as clients will see it"
          className="w-full h-12 px-4 rounded-[12px] text-[17px] outline-none"
          style={{
            background: '#1E1E1E',
            color: '#F5F5F5',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </FormSection>

      {/* Bio */}
      <FormSection label="Bio" hint={`${bio.length}/500`}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          placeholder="What makes you a great trainer? Your approach, philosophy, achievements..."
          rows={4}
          className="w-full px-4 py-3 rounded-[12px] text-[15px] outline-none resize-none"
          style={{
            background: '#1E1E1E',
            color: '#F5F5F5',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </FormSection>

      {/* Specializations */}
      <FormSection label="Specializations" hint="Pick 1–3">
        <div className="flex flex-wrap gap-2">
          {ALL_SPECIALIZATIONS.map((spec) => {
            const isSelected = selectedSpecs.includes(spec);
            return (
              <motion.button
                key={spec}
                whileTap={{ scale: 0.95 }}
                transition={springSnappy}
                onClick={() => toggleSpec(spec)}
                className="px-3.5 py-2 rounded-full text-[13px] font-semibold"
                style={{
                  background: isSelected
                    ? `${SPEC_COLORS[spec]}20`
                    : 'rgba(255,255,255,0.07)',
                  color: isSelected ? SPEC_COLORS[spec] : 'rgba(245,245,245,0.55)',
                  border: isSelected
                    ? `1.5px solid ${SPEC_COLORS[spec]}50`
                    : '1.5px solid transparent',
                }}
              >
                {SPEC_LABELS[spec]}
              </motion.button>
            );
          })}
        </div>
      </FormSection>

      {/* Certifications */}
      <FormSection label="Certifications" hint="Optional">
        <div className="flex flex-col gap-3">
          {certifications.map((cert, i) => (
            <div
              key={i}
              className="rounded-[12px] p-3 flex flex-col gap-2"
              style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium" style={{ color: 'rgba(245,245,245,0.40)' }}>
                  Certification {i + 1}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  transition={springSnappy}
                  onClick={() => removeCert(i)}
                >
                  <Icon name="xmark" size={14} color="rgba(245,245,245,0.40)" />
                </motion.button>
              </div>
              <input
                type="text"
                value={cert.name}
                onChange={(e) => updateCert(i, 'name', e.target.value)}
                placeholder="e.g., NASM-CPT"
                maxLength={100}
                className="w-full h-10 px-3 rounded-[8px] text-[15px] outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#F5F5F5',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cert.issuedBy}
                  onChange={(e) => updateCert(i, 'issuedBy', e.target.value)}
                  placeholder="Issuer (e.g., NASM)"
                  maxLength={100}
                  className="flex-1 h-10 px-3 rounded-[8px] text-[15px] outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: '#F5F5F5',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
                <input
                  type="number"
                  value={cert.year}
                  onChange={(e) => updateCert(i, 'year', Number(e.target.value))}
                  min={1950}
                  max={new Date().getFullYear()}
                  className="w-20 h-10 px-3 rounded-[8px] text-[15px] outline-none text-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: '#F5F5F5',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
              </div>
            </div>
          ))}
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={addCertification}
            className="flex items-center justify-center gap-2 h-11 rounded-[12px]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed rgba(255,255,255,0.15)',
            }}
          >
            <Icon name="plus" size={14} color="rgba(245,245,245,0.50)" />
            <span className="text-[14px] font-medium" style={{ color: 'rgba(245,245,245,0.50)' }}>
              Add Certification
            </span>
          </motion.button>
        </div>
      </FormSection>

      {/* Experience */}
      <FormSection label="Years of Experience">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            onClick={() => setExperienceYears(Math.max(0, experienceYears - 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <Icon name="minus" size={16} color="#F5F5F5" />
          </motion.button>
          <span
            className="text-[28px] font-bold tabular-nums min-w-[48px] text-center"
            style={{ color: '#C5F74F' }}
          >
            {experienceYears}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            onClick={() => setExperienceYears(Math.min(50, experienceYears + 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <Icon name="plus" size={16} color="#F5F5F5" />
          </motion.button>
          <span className="text-[15px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
            year{experienceYears !== 1 ? 's' : ''}
          </span>
        </div>
      </FormSection>

      {/* Submit */}
      <div className="pt-2 pb-8">
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
          {isSubmitting ? 'Submitting…' : 'Submit Application'}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Form Section helper ──────────────────────────────────────────

function FormSection({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[13px] font-bold uppercase tracking-[0.08em]"
          style={{ color: 'rgba(245,245,245,0.40)' }}
        >
          {label}
        </span>
        {hint && (
          <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.30)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
