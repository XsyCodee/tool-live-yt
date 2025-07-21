// src/app/dashboard/DashboardClient.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient';
import { uploadFileToR2 } from '@/lib/uploadFileToR2';

import Sidebar from '@/components/Layout/sidebar';
import Header from '@/components/Layout/Header';
import DashboardSection from '@/components/Sections/DashboardSection';
import ActiveStreamsSection from '@/components/Sections/ActiveStreamsSection';
import ContentManagementSection from '@/components/Sections/ContentManagementSection';
import MyPlaylistsSection from '@/components/Sections/MyPlaylistsSection';
import UsageBillingSection from '@/components/Sections/UsageBillingSection';
import AccountSettingsSection from '@/components/Sections/AccountSettingsSection';
import HelpSection from '@/components/Sections/HelpSection';
import NotificationsSection from '@/components/Sections/NotificationsSection';
import NewStreamModal from '@/components/Modals/NewStreamModal';

export default function DashboardClient() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showNewStreamModal, setShowNewStreamModal] = useState(false);
  const [newStreamStep, setNewStreamStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistItems, setPlaylistItems] = useState([]);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamVisibility, setStreamVisibility] = useState('public');
  const [streamResolution, setStreamResolution] = useState('720p');
  const [startNow, setStartNow] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [loopPlaylist, setLoopPlaylist] = useState(true);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeStreams, setActiveStreams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [uploadCompletedAndReady, setUploadCompletedAndReady] = useState(false);

  // --- STATE BARU UNTUK PENGATURAN STREAM ---
  const [streamCategory, setStreamCategory] = useState(''); // Default kosong
  const [isMadeForKids, setIsMadeForKids] = useState(false); // Default tidak untuk anak-anak
  const [enableLiveChat, setEnableLiveChat] = useState(true); // Default aktif
  const [enableLiveChatRecording, setEnableLiveChatRecording] = useState(true); // Default aktif
  const [enableLiveChatHighlights, setEnableLiveChatHighlights] = useState(true); // Default aktif
  const [liveChatParticipantMode, setLiveChatParticipantMode] = useState('any'); // Default siapa saja
  const [enableReactions, setEnableReactions] = useState(true); // Default aktif
  // --- AKHIR STATE BARU ---

  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      alert('Logout berhasil');
      router.push('/login');
    } else {
      alert('Logout gagal');
    }
  };

  const handleFileDrop = async (eOrFiles) => {
    let files;

    if (eOrFiles && eOrFiles.dataTransfer && eOrFiles.dataTransfer.files) {
      eOrFiles.preventDefault();
      files = Array.from(e.dataTransfer.files);
      console.log('DEBUG: handleFileDrop triggered by DRAG-AND-DROP.');
    } else if (Array.isArray(eOrFiles)) {
      files = eOrFiles;
      console.log('DEBUG: handleFileDrop triggered by MODAL FILE INPUT.');
    } else {
      console.error('ERROR: handleFileDrop received invalid input:', eOrFiles);
      return;
    }

    console.log('DEBUG: Files received in handleFileDrop (DashboardClient):', files);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Gagal mendapatkan user login:', userError);
      alert('Anda harus login untuk mengunggah file.');
      return;
    }

    setIsUploadingFile(true);
    setUploadCompletedAndReady(false);
    const newUploadedFiles = [];
    try {
      for (const file of files) {
        console.log('DEBUG: Calling uploadFileToR2 for file:', file.name);
        const result = await uploadFileToR2(file, user.id);
        if (result.data) {
          const publicUrl = result.data.publicUrl;
          const uploadedFileWithMetadata = {
            id: result.data.id,
            name: file.name,
            size: file.size,
            uploaded_at: new Date().toISOString(),
            publicUrl: publicUrl,
            storage_path: result.data.storage_path,
          };
          newUploadedFiles.push(uploadedFileWithMetadata);

          setNotifications(prev => [...prev, {
            id: Date.now(),
            message: `File "${file.name}" berhasil diunggah.`,
            type: 'success',
            unread: true,
          }]);
        } else {
          console.error('Upload gagal:', result.error.message);
          setNotifications(prev => [...prev, {
            id: Date.now(),
            message: `Gagal mengunggah "${file.name}": ${result.error.message}`,
            type: 'error',
            unread: true,
          }]);
        }
      }
      setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
      setSelectedFiles(newUploadedFiles);
      setUploadCompletedAndReady(true);
    } catch (error) {
      console.error('Error during file upload process:', error.message);
      alert(`Terjadi kesalahan saat mengunggah file: ${error.message}`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  useEffect(() => {
    if (uploadCompletedAndReady && newStreamStep === 1) {
      console.log("DEBUG: Auto-advancing to step 3 after successful upload.");
      setNewStreamStep(3);
      setUploadCompletedAndReady(false);
    }
  }, [uploadCompletedAndReady, newStreamStep]);


  const handleStartStreamFromModal = async () => {
    console.log('DEBUG: handleStartStreamFromModal triggered.');
    console.log('DEBUG: State at start of handleStartStreamFromModal:');
    console.log('  isUploadingFile:', isUploadingFile);
    console.log('  selectedFiles:', selectedFiles);
    console.log('  selectedFiles.length:', selectedFiles.length);
    console.log('  selectedFiles[0]:', selectedFiles[0]);
    console.log('  selectedFiles[0]?.storage_path:', selectedFiles[0]?.storage_path);
    console.log('  selectedFiles[0]?.publicUrl:', selectedFiles[0]?.publicUrl);


    if (isUploadingFile || !selectedFiles[0] || !selectedFiles[0].storage_path || !selectedFiles[0].publicUrl) {
        alert('Detail video yang diunggah tidak ditemukan atau proses upload masih berjalan. Mohon tunggu atau unggah ulang.');
        console.error('Error: selectedFiles[0] or its storage_path/publicUrl is missing, or upload is still in progress.', { firstFile: selectedFiles[0], isUploadingFile });
        return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Gagal mendapatkan user login:', authError);
      alert('Anda harus login untuk membuat stream.');
      return;
    }

    if (!confirm("Apakah Anda yakin ingin memulai stream dengan biaya yang dihitung?")) {
      return;
    }

    const firstFile = selectedFiles[0];
    const videoStoragePath = firstFile.storage_path;
    const videoPublicUrl = firstFile.publicUrl;

    try {
      console.log("Memanggil API /api/youtube/create-live-broadcast...");
      const createBroadcastResponse = await fetch('/api/youtube/create-live-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          streamTitle: streamTitle,
          streamDescription: streamDescription,
          streamVisibility: streamVisibility,
          scheduledDateTime: startNow ? new Date().toISOString() : scheduledDateTime,
          streamResolution: streamResolution,
          // --- PROPS BARU UNTUK BACKEND ---
          streamCategory: streamCategory,
          isMadeForKids: isMadeForKids,
          enableLiveChat: enableLiveChat,
          enableLiveChatRecording: enableLiveChatRecording,
          enableLiveChatHighlights: enableLiveChatHighlights,
          liveChatParticipantMode: liveChatParticipantMode,
          enableReactions: enableReactions,
          // --- AKHIR PROPS BARU ---
        }),
      });
      const broadcastData = await createBroadcastResponse.json();

      if (!createBroadcastResponse.ok || !broadcastData.success) {
        throw new Error(broadcastData.message || 'Failed to create YouTube broadcast.');
      }

      const { broadcastId, streamId, rtmpUrl, streamKey, youtubeWatchUrl } = broadcastData;
      console.log("YouTube Broadcast & Stream created successfully:", broadcastData);

      // --- NEW STEP: Call FFmpeg start stream API (start-ffmpeg-stream) ---
      console.log("Memanggil API /api/youtube/start-ffmpeg-stream untuk memulai FFmpeg...");
      const startFfmpegResponse = await fetch('/api/youtube/start-ffmpeg-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          videoStoragePath: videoStoragePath,
          rtmpUrl: rtmpUrl, // rtmpUrl yang sudah digabungkan dan dibersihkan dari create-live-broadcast
          streamKey: streamKey, // Stream key asli (untuk debugging di start-ffmpeg-stream jika perlu)
          streamResolution: streamResolution,
          videoPublicUrl: videoPublicUrl,
          broadcastId: broadcastId,
        }),
      });
      const ffmpegStatus = await startFfmpegResponse.json();

      if (!startFfmpegResponse.ok || !ffmpegStatus.success) {
        throw new Error(ffmpegStatus.message || 'Failed to start FFmpeg stream.');
      }
      console.log("FFmpeg stream initiation status:", ffmpegStatus.message);

      // --- NEW STEP: Call API untuk transisi broadcast ke live (start-stream) ---
      console.log('Memanggil API /api/youtube/start-stream untuk transisi broadcast ke live...');
      const transitionResponse = await fetch('/api/youtube/start-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          broadcastId: broadcastId,
          streamId: streamId,
        }),
      });
      const transitionResult = await transitionResponse.json();

      if (!transitionResponse.ok || !transitionResult.success) {
        console.error('Gagal transisi broadcast:', transitionResult);
        alert(`Failed to transition broadcast to live: ${transitionResult.message || transitionResult.error || 'Unknown error'}`);
      } else {
        console.log('Broadcast is now live!', transitionResult);
        alert('Live stream started successfully!');
        // Anda bisa mengarahkan pengguna ke youtubeWatchUrl di sini jika diinginkan
        // window.open(youtubeWatchUrl, '_blank');
      }

      const newStream = {
        id: broadcastId,
        name: streamTitle,
        status: 'Sedang Diproses',
        resolution: streamResolution,
        startTime: new Date().toLocaleString(),
        duration: 'Live',
        bandwidthUsed: 'Mengalir',
        link: youtubeWatchUrl,
        error: false,
      };
      setActiveStreams(prev => [...prev, newStream]);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        message: `Stream "${newStream.name}" sedang dimulai di YouTube. Cek kanal Anda!`,
        type: 'info',
        unread: true,
      }]);

    } catch (error) {
      console.error("Error during stream initiation:", error.message);
      alert(`Gagal memulai stream: ${error.message}`);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        message: `Gagal memulai stream: ${error.message}`,
        type: 'error',
        unread: true,
      }]);
    } finally {
      setShowNewStreamModal(false);
      setNewStreamStep(1);
      setSelectedFiles([]);
      setPlaylistName('');
      setPlaylistItems([]);
      setStreamTitle('');
      setStreamDescription('');
      setStreamVisibility('public');
      setStreamResolution('720p');
      setStartNow(true);
      setScheduledDateTime('');
      setLoopPlaylist(true);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-inter">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} handleLogout={handleLogout} />
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <Header activeSection={activeSection} unreadNotificationsCount={unreadNotificationsCount} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeSection === 'dashboard' && (
            <DashboardSection
              activeStreams={activeStreams}
              setShowNewStreamModal={setShowNewStreamModal}
              setNewStreamStep={setNewStreamStep}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'active-streams' && <ActiveStreamsSection activeStreams={activeStreams} />}
          {activeSection === 'content-management' && (
            <ContentManagementSection
              uploadedFiles={uploadedFiles}
              handleFileDrop={handleFileDrop}
              setSelectedFiles={setSelectedFiles}
            />
          )}
          {activeSection === 'my-playlists' && (
            <MyPlaylistsSection
              playlists={playlists}
              setShowNewStreamModal={setShowNewStreamModal}
              setNewStreamStep={setNewStreamStep}
            />
          )}
          {activeSection === 'usage-billing' && <UsageBillingSection />}
          {activeSection === 'account-settings' && (
            <AccountSettingsSection />
          )}
          {activeSection === 'help' && <HelpSection />}
          {activeSection === 'notifications' && (
            <NotificationsSection
              notifications={notifications}
              markNotificationAsRead={(id) => {
                setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
              }}
              unreadNotificationsCount={unreadNotificationsCount}
            />
          )}
        </main>

        {showNewStreamModal && (
          <NewStreamModal
            showNewStreamModal={showNewStreamModal}
            setShowNewStreamModal={setShowNewStreamModal}
            newStreamStep={newStreamStep}
            setNewStreamStep={setNewStreamStep}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            playlistName={playlistName}
            setPlaylistName={setPlaylistName}
            playlistItems={playlistItems}
            streamTitle={streamTitle}
            setStreamTitle={setStreamTitle}
            streamDescription={streamDescription}
            setStreamDescription={setStreamDescription}
            streamVisibility={streamVisibility}
            setStreamVisibility={setStreamVisibility}
            streamResolution={streamResolution}
            setStreamResolution={setStreamResolution}
            startNow={startNow}
            setStartNow={setStartNow}
            scheduledDateTime={scheduledDateTime}
            setScheduledDateTime={setScheduledDateTime}
            loopPlaylist={loopPlaylist}
            setLoopPlaylist={setLoopPlaylist}
            previewComponent={
              selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview Video:</h4>
                  <div className="flex flex-wrap gap-4">
                    {selectedFiles.map((file) =>
                      file.type?.startsWith('video') ? (
                        <video
                          key={file.name}
                          src={URL.createObjectURL(file)}
                          controls
                          className="w-full max_w_xs rounded border shadow"
                        />
                      ) : null
                    )}
                  </div>
                </div>
              )
            }
            handleCreatePlaylist={() => {
              if (playlistName && selectedFiles.length > 0) {
                setPlaylists(prev => [...prev, {
                  id: Date.now().toString(),
                  name: playlistName,
                  items: selectedFiles.length,
                  duration: 'N/A',
                }]);
                setPlaylistItems(selectedFiles);
                setNewStreamStep(3);
              } else {
                alert('Nama dan item playlist tidak boleh kosong');
              }
            }}
            handleStartStream={handleStartStreamFromModal}
            handleFileDrop={handleFileDrop}
            isUploadingFile={isUploadingFile}
            // --- TERUSKAN PROPS BARU KE MODAL ---
            streamCategory={streamCategory}
            setStreamCategory={setStreamCategory}
            isMadeForKids={isMadeForKids}
            setIsMadeForKids={setIsMadeForKids}
            enableLiveChat={enableLiveChat}
            setEnableLiveChat={setEnableLiveChat}
            enableLiveChatRecording={enableLiveChatRecording}
            setEnableLiveChatRecording={setEnableLiveChatRecording}
            enableLiveChatHighlights={enableLiveChatHighlights}
            setEnableLiveChatHighlights={setEnableLiveChatHighlights}
            liveChatParticipantMode={liveChatParticipantMode}
            setLiveChatParticipantMode={setLiveChatParticipantMode}
            enableReactions={enableReactions}
            setEnableReactions={setEnableReactions}
            // --- AKHIR TERUSKAN PROPS BARU ---
          />
        )}
      </div>
    </div>
  );
}
