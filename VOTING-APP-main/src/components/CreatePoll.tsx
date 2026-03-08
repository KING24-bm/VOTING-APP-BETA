import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Upload } from 'lucide-react';
import Header from './Header';

interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
  logoUrl: string;
}

interface Role {
  id: string;
  name: string;
  candidates: Candidate[];
}

interface CreatePollProps {
  onBack: () => void;
}

export default function CreatePoll({ onBack }: CreatePollProps) {
  const { teacherId } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: '', candidates: [] },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addRole = () => {
    setRoles([
      ...roles,
      { id: Date.now().toString(), name: '', candidates: [] },
    ]);
  };

  const removeRole = (roleId: string) => {
    setRoles(roles.filter((r) => r.id !== roleId));
  };

  const updateRoleName = (roleId: string, name: string) => {
    setRoles(
      roles.map((r) => (r.id === roleId ? { ...r, name } : r))
    );
  };

  const addCandidate = (roleId: string) => {
    setRoles(
      roles.map((r) =>
        r.id === roleId
          ? {
              ...r,
              candidates: [
                ...r.candidates,
                { id: Date.now().toString(), name: '', imageUrl: '', logoUrl: '' },
              ],
            }
          : r
      )
    );
  };

  const removeCandidate = (roleId: string, candidateId: string) => {
    setRoles(
      roles.map((r) =>
        r.id === roleId
          ? {
              ...r,
              candidates: r.candidates.filter((c) => c.id !== candidateId),
            }
          : r
      )
    );
  };

  const updateCandidate = (
    roleId: string,
    candidateId: string,
    field: 'name' | 'imageUrl' | 'logoUrl',
    value: string
  ) => {
    setRoles(
      roles.map((r) =>
        r.id === roleId
          ? {
              ...r,
              candidates: r.candidates.map((c) =>
                c.id === candidateId ? { ...c, [field]: value } : c
              ),
            }
          : r
      )
    );
  };

  const handleImageUpload = async (
    roleId: string,
    candidateId: string,
    file: File,
    field: 'imageUrl' | 'logoUrl'
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `candidates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl || '';

      updateCandidate(roleId, candidateId, field, publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image.');
    }
  };

  const validatePoll = () => {
    if (!title.trim()) return 'Please enter a poll title.';
    if (roles.length === 0) return 'Please add at least one role.';

    for (const role of roles) {
      if (!role.name.trim()) return 'Please enter a name for every role.';
      if (role.candidates.length === 0) return 'Each role must have at least one candidate.';
      for (const candidate of role.candidates) {
        if (!candidate.name.trim()) return 'Please enter a name for every candidate.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teacherId) {
      setError('You must be logged in as a teacher.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a poll title');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title,
          description,
          created_by: teacherId,
          is_active: true,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      for (const role of roles) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .insert({
            poll_id: poll.id,
            name: role.name,
          })
          .select()
          .single();

        if (roleError) throw roleError;

        for (const candidate of role.candidates) {
          const { error: candidateError } = await supabase
            .from('candidates')
            .insert({
              role_id: roleData.id,
              name: candidate.name,
              image_url: candidate.imageUrl,
              logo_url: candidate.logoUrl,
            });

          if (candidateError) throw candidateError;
        }
      }

      alert('Poll created successfully!');
      onBack();
    } catch (err) {
      console.error('Error creating poll:', err);
      setError('Failed to create poll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 overflow-hidden">

      {/* Rotating Background */}
      <div
        className="rotating-bg"
        style={{
          backgroundImage: "url('/images/euroschool-logo-bg.png')"
        }}
      ></div>

      <Header />

      <div className="relative container mx-auto max-w-4xl">

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Poll title"
              />
            </div>

            {roles.map((role) => (
              <div key={role.id} className="border-2 rounded-xl p-6 space-y-4">

                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) => updateRoleName(role.id, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="Role name"
                  />
                  <button
                    type="button"
                    onClick={() => removeRole(role.id)}
                    className="p-2 text-red-600"
                  >
                    <Trash2 />
                  </button>
                </div>

                {role.candidates.map((candidate) => (
                  <div key={candidate.id} className="flex flex-col gap-3 bg-gray-50 p-4 rounded-lg">

                    <input
                      type="text"
                      value={candidate.name}
                      onChange={(e) =>
                        updateCandidate(role.id, candidate.id, 'name', e.target.value)
                      }
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Candidate name"
                    />

                    <input
                      type="url"
                      value={candidate.imageUrl}
                      onChange={(e) =>
                        updateCandidate(role.id, candidate.id, 'imageUrl', e.target.value)
                      }
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Image URL"
                    />

                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addCandidate(role.id)}
                  className="flex items-center gap-2 text-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add candidate
                </button>

              </div>
            ))}

            {error && <p className="text-red-600">{error}</p>}

            <div className="flex justify-end gap-4">
              <button type="button" onClick={onBack} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                {isSubmitting ? 'Publishing...' : 'Publish poll'}
              </button>
            </div>

          </form>
        </div>
      </div>

      <style>{`
        .rotating-bg {
          position: absolute;
          inset: 0;
          background-repeat: no-repeat;
          background-position: center;
          background-size: 650px;
          opacity: 0.08;
          animation: rotateBg 60s linear infinite;
          pointer-events: none;
        }

        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}