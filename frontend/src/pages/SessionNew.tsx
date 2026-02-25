import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../api/sessions";
import { getDashboard, uploadDocument } from "../api/documents";

export default function SessionNew() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [documentId, setDocumentId] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [docsLoading, setDocsLoading] = useState(true);

  // Upload state
  const [docSource, setDocSource] = useState<"existing" | "upload">("existing");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDashboard()
      .then((data) => setDocuments(data.docs || []))
      .catch(console.error)
      .finally(() => setDocsLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, ""));
      const { document } = await uploadDocument(formData);
      setUploadedFile(document);
      setDocumentId(document.id);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { session } = await createSession({
        documentId: documentId as number,
        title: title.trim(),
        maxParticipants,
      });
      navigate(`/sessions/${session.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">New Session</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Create a collaborative session to review a document with your team.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 Proposal Review"
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Document</label>

            {/* Source tabs */}
            <div className="flex gap-1 mb-3 bg-neutral-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setDocSource("existing"); setUploadedFile(null); }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${docSource === "existing" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                Choose Existing
              </button>
              <button
                type="button"
                onClick={() => { setDocSource("upload"); setDocumentId(""); }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${docSource === "upload" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                Upload New File
              </button>
            </div>

            {docSource === "existing" ? (
              docsLoading ? (
                <div className="text-sm text-neutral-400 py-2">Loading documents...</div>
              ) : (
                <select
                  value={documentId}
                  onChange={(e) => setDocumentId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
                  required>
                  <option value="">Select a document</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <div>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-800 truncate">{uploadedFile.fileName}</p>
                      <p className="text-xs text-emerald-600">Uploaded successfully</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); setDocumentId(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-medium"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading ? "border-neutral-200 bg-neutral-50" : "border-neutral-300 hover:border-brand-400 hover:bg-brand-50/30"}`}
                    >
                      {uploading ? (
                        <>
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-600 mb-2" />
                          <span className="text-sm text-neutral-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <span className="text-sm font-medium text-neutral-600">Click to upload</span>
                          <span className="text-xs text-neutral-400 mt-0.5">PDF, PNG, JPG, GIF, WebP</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Max Participants</label>
            <select
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white">
              {[2, 3, 4, 5, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} participants
                </option>
              ))}
            </select>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/sessions")}
              className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !documentId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 shadow-md shadow-brand-600/20 transition-colors">
              {loading ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
