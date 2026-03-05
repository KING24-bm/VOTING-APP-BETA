import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import Header from './Header';

interface Candidate {
  id: string;
  name: string;
  imageUrl: string;   // main picture
  logoUrl: string;    // additional logo
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

      // include contentType and avoid overwriting by default
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });

      if (uploadError) {
        console.error('Supabase upload error details:', uploadError);
        throw uploadError;
      }

      // getPublicUrl is synchronous in supabase-js v2
      const { data: publicData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const publicUrl = (publicData && (publicData as any).publicUrl) || '';

      if (!publicUrl) {
        console.error('Failed to get public URL after upload', { uploadData, publicData });
        throw new Error('Failed to obtain public URL for uploaded file');
      }

      updateCandidate(roleId, candidateId, field, publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      // Prefer readable message when available
      const message = (err as any)?.message || (err as any)?.error || JSON.stringify(err);
      alert(`Failed to upload image. ${message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teacherId) {
      setError('You must be logged in as a teacher to publish a poll.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a poll title');
      return;
    }

    if (roles.length === 0) {
      setError('Please add at least one role');
      return;
    }

    for (const role of roles) {
      if (!role.name.trim()) {
        setError('All roles must have a name');
        return;
      }
      if (role.candidates.length === 0) {
        setError(`Role "${role.name}" must have at least one candidate`);
        return;
      }
      for (const candidate of role.candidates) {
        if (!candidate.name.trim()) {
          setError(`All candidates in "${role.name}" must have a name`);
          return;
        }
      }
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
              logo_url: candidate.logoUrl, // new column
            });

          if (candidateError) throw candidateError;
        }
      }

      alert('Poll created successfully!');
      onBack();
    } catch (err) {
      console.error('Error creating poll:', err);
      const message =
        (err as any)?.message ||
        (err as any)?.error ||
        JSON.stringify(err);
      setError(message || 'Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Header />
      <div className="container mx-auto max-w-4xl">
        <img
          src="/images/euroschool-logo.png"
          alt="EuroSchool North Campus"
          className="h-16 w-16 object-contain mb-8"
        />
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Poll title"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write a short description"
                rows={3}
              />
            </div>

            {roles.map((role) => (
              <div
                key={role.id}
                className="border-2 border-gray-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) =>
                      updateRoleName(role.id, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Role name"
                  />
                  <button
                    type="button"
                    onClick={() => removeRole(role.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {role.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) =>
                          updateCandidate(
                            role.id,
                            candidate.id,
                            'name',
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Candidate name"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          removeCandidate(role.id, candidate.id)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* candidate picture */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={candidate.imageUrl}
                        onChange={(e) =>
                          updateCandidate(
                            role.id,
                            candidate.id,
                            'imageUrl',
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Image URL (candidate picture)"
                      />
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer transition text-sm">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(
                                role.id,
                                candidate.id,
                                file,
                                'imageUrl'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* candidate logo */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={candidate.logoUrl}
                        onChange={(e) =>
                          updateCandidate(
                            role.id,
                            candidate.id,
                            'logoUrl',
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Logo URL (candidate logo)"
                      />
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg cursor-pointer transition text-sm">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(
                                role.id,
                                candidate.id,
                                file,
                                'logoUrl'
                              );
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* previews */}
                    <div className="flex gap-2">
                      {candidate.imageUrl && (
                        <img
                          src={candidate.imageUrl}
                          alt={`${candidate.name} picture`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      {candidate.logoUrl && (
                        <img
                          src={candidate.logoUrl}
                          alt={`${candidate.name} logo`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addCandidate(role.id)}
                  className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add candidate
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRole}
              className="flex items-center gap-2 text-green-600 hover:text-green-800 transition"
            >
              <Plus className="w-4 h-4" />
              Add role
            </button>

            {error && <p className="text-red-600">{error}</p>}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish poll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}