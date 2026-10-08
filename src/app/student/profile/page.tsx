'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import {
  User, Mail, Phone, School, BookOpen, Languages,
  Award, Camera, Edit3, Save, X, Loader2, CheckCircle, Trash2
} from 'lucide-react';

export default function StudentProfilePage() {
  const { studentProfile, updateProfile, uploadProfilePicture, deleteProfilePicture } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [parentGuardianName, setParentGuardianName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [board, setBoard] = useState('');
  const [medium, setMedium] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const startEditing = () => {
    setDisplayName(studentProfile?.displayName || '');
    setParentGuardianName(studentProfile?.parentGuardianName || '');
    setPhoneNumber(studentProfile?.phoneNumber || '');
    setBoard(studentProfile?.board || 'CBSE');
    setMedium(studentProfile?.medium || 'ENGLISH');
    setIsEditing(true);
    setSaveSuccess(false);
    setSaveError('');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await updateProfile({ displayName, parentGuardianName, phoneNumber, board, medium });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setSaveError(e?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      await uploadProfilePicture(file);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setUploadError(error?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePicture = async () => {
    if (!window.confirm('Remove your profile picture?')) return;
    setIsUploading(true);
    try {
      await deleteProfilePicture();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const profilePicUrl = studentProfile?.profilePicture || (studentProfile as { photoURL?: string } | null)?.photoURL;
  const initials = studentProfile?.displayName?.charAt(0)?.toUpperCase() || 'S';

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="My Profile"
              subtitle="Manage your personal information, board settings, and profile picture"
            />

            <div className="p-6 max-w-4xl w-full mx-auto space-y-6">

              {/* Profile picture & name card */}
              <Card className="p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

                  {/* Profile picture */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
                      {profilePicUrl ? (
                        <Image
                          src={profilePicUrl}
                          alt={studentProfile?.displayName || 'Profile'}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-black text-white">{initials}</span>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Camera button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
                      title="Upload profile picture"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Name & badges */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {studentProfile?.displayName || 'Student'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{studentProfile?.email}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                      <Badge variant="primary" size="sm">
                        {studentProfile?.class || 'Class 9'} • {studentProfile?.board || 'CBSE'}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        {studentProfile?.medium || 'ENGLISH'}
                      </Badge>
                      <Badge variant="success" size="sm">
                        Level {studentProfile?.level || 1} ({studentProfile?.xp || 0} XP)
                      </Badge>
                    </div>

                    {/* Upload errors */}
                    {uploadError && (
                      <p className="mt-2 text-xs text-rose-500 font-medium">⚠️ {uploadError}</p>
                    )}

                    {/* Picture actions */}
                    <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-50"
                      >
                        {profilePicUrl ? 'Change photo' : 'Upload photo'}
                      </button>
                      {profilePicUrl && (
                        <button
                          onClick={handleDeletePicture}
                          disabled={isUploading}
                          className="text-xs text-rose-500 hover:underline font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP · Max 5MB</p>
                  </div>

                  {/* Edit button */}
                  <div className="flex-shrink-0">
                    {!isEditing ? (
                      <Button size="sm" variant="ghost" onClick={startEditing} className="gap-2">
                        <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                      </Button>
                    ) : (
                      <button onClick={cancelEditing} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Editable info card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Personal Information</h3>
                  {saveSuccess && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Full Name */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <User className="w-3.5 h-3.5" /> Full Name
                    </label>
                    {isEditing ? (
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile?.displayName || '—'}</p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email Address
                    </label>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile?.email || '—'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Email cannot be changed here.</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Number
                    </label>
                    {isEditing ? (
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {studentProfile?.phoneNumber ? `•••• •••• ${studentProfile.phoneNumber.slice(-4)}` : '—'}
                      </p>
                    )}
                  </div>

                  {/* Parent / Guardian */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">Parent / Guardian Name</label>
                    {isEditing ? (
                      <input type="text" value={parentGuardianName} onChange={(event) => setParentGuardianName(event.target.value)} required
                        className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile?.parentGuardianName || 'Not added yet'}</p>
                    )}
                  </div>

                  {/* Class (read-only) */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <School className="w-3.5 h-3.5" /> Class
                    </label>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile?.class || 'Class 9'}</p>
                  </div>

                  {/* Board */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Board
                    </label>
                    {isEditing ? (
                      <select value={board} onChange={(e) => setBoard(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="CBSE">CBSE</option>
                        <option value="AP_STATE_BOARD">AP State Board</option>
                      </select>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile?.board || '—'}</p>
                    )}
                  </div>

                  {/* Medium */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <Languages className="w-3.5 h-3.5" /> Medium
                    </label>
                    {isEditing ? (
                      <select value={medium} onChange={(e) => setMedium(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="ENGLISH">English</option>
                        <option value="TELUGU">Telugu</option>
                      </select>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile?.medium || '—'}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                      <Award className="w-3.5 h-3.5" /> Account Type
                    </label>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Student</p>
                  </div>

                  {/* Student Code */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">Student Code</label>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{studentProfile?.studentCode || 'Not available'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Share this code only with your parent or guardian.</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300" role="status">
                      {studentProfile?.linkedParentCount
                        ? `${studentProfile.linkedParentCount} parent or guardian linked`
                        : 'No parent or guardian linked yet'}
                    </p>
                  </div>
                </div>

                {/* Error */}
                {saveError && (
                  <p className="mt-4 text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
                    ⚠️ {saveError}
                  </p>
                )}

                {/* Save button */}
                {isEditing && (
                  <div className="flex gap-3 mt-5">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="ghost" onClick={cancelEditing} disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>

              {/* Performance card */}
              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Learning Performance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'XP Earned', value: studentProfile?.xp || 0 },
                    { label: 'Level', value: studentProfile?.level || 1 },
                    { label: 'Streak', value: `${studentProfile?.streakDays || 0} days` },
                    { label: 'Questions Solved', value: studentProfile?.questionsSolved || 0 },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{stat.value}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
