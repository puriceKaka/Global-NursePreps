const newMeetingBtn = document.getElementById('newMeetingBtn');
const newMeetingOpenBtn = document.getElementById('newMeetingOpenBtn');
const joinMeetingBtn = document.getElementById('joinMeetingBtn');
const createMeetingBtn = document.getElementById('createMeetingBtn');
const cancelMeetingBtn = document.getElementById('cancelMeetingBtn');
const closeModalBtn = document.getElementById('closeModal');
const newMeetingModal = document.getElementById('newMeetingModal');
const joinMeetingModal = document.getElementById('joinMeetingModal');
const closeJoinModalBtn = document.getElementById('closeJoinModal');
const cancelJoinBtn = document.getElementById('cancelJoinBtn');
const joinMeetingConfirmBtn = document.getElementById('confirmJoinMeetingBtn');
const meetingNameInput = document.getElementById('meetingNameInput');
const meetingStartDateInput = document.getElementById('meetingStartDateInput');
const meetingStartTimeInput = document.getElementById('meetingStartTimeInput');
const meetingEndDateInput = document.getElementById('meetingEndDateInput');
const meetingEndTimeInput = document.getElementById('meetingEndTimeInput');
const joinCodeInput = document.getElementById('joinCodeInput');
const userNameInput = document.getElementById('userNameInput');
const heroIntro = document.getElementById('heroIntro');
const heroActions = document.querySelector('.hero-actions');
const activeMeetingBar = document.getElementById('activeMeetingBar');
const meetingTitle = document.getElementById('meetingTitle');
const meetingSubtitle = document.getElementById('meetingSubtitle');
const roomLabel = document.getElementById('roomLabel');
const meetingStatus = document.getElementById('meetingStatus');
const meetingTimeLabel = document.getElementById('meetingTimeLabel');
const networkQualityLabel = document.getElementById('networkQualityLabel');
const meetingScheduleRow = document.getElementById('meetingScheduleRow');
const meetingStartDisplay = document.getElementById('meetingStartDisplay');
const meetingEndDisplay = document.getElementById('meetingEndDisplay');
const micButton = document.getElementById('micButton');
const cameraButton = document.getElementById('cameraButton');
const screenButton = document.getElementById('screenButton');
const leaveCallButton = document.getElementById('leaveCallButton');
const menuButton = document.getElementById('menuButton');
const menuPopup = document.getElementById('menuPopup');
const raiseHandButton = document.getElementById('raiseHandButton');
const copyLinkButton = document.getElementById('copyLinkButton');
const floatVideoButton = document.getElementById('floatVideoButton');
const videoStage = document.getElementById('videoStage');
const videoGrid = document.getElementById('videoGrid');
const emptyState = document.getElementById('emptyState');
const meetingToolsPanel = document.getElementById('meetingToolsPanel');
const chatToggleButton = document.getElementById('chatToggleButton');
const recordToggleButton = document.getElementById('recordToggleButton');
const participantsToggleButton = document.getElementById('participantsToggleButton');
const chatPanel = document.getElementById('chatPanel');
const recordPanel = document.getElementById('recordPanel');
const participantsPanel = document.getElementById('participantsPanel');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const recordVideoToggle = document.getElementById('recordVideoToggle');
const recordAudioToggle = document.getElementById('recordAudioToggle');
const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const recordStatusText = document.getElementById('recordStatusText');
const recordDownloadLink = document.getElementById('recordDownloadLink');
const participantsCount = document.getElementById('participantsCount');
const participantsList = document.getElementById('participantsList');
const toolCloseButtons = document.querySelectorAll('[data-close-tool]');

let socket = null;
let mediaStream = null;
let localStream = null;
let screenShareStream = null;
let peers = {};
let currentRoomId = null;
let currentSocketId = null;
let joinedSocketRoomId = null;
let userName = 'You';
let meetingActive = false;
let micOn = true;
let cameraOn = true;
let screenSharing = false;
let creatingMeeting = false;
let meetingStartedAt = null;
let meetingTimerInterval = null;
let activeTool = null;
let participants = new Map();
let handRaised = false;
let recorder = null;
let recorderChunks = [];
let recorderUrl = null;
let localPreviewStream = null;
let currentMeetingTitle = 'Create a live meeting';
let pendingSchedule = null;
let networkMonitorInterval = null;
let currentQualityMode = 'standard';
const CAMERA_CONSTRAINTS = {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user'
};
const LOW_BANDWIDTH_CAMERA_CONSTRAINTS = {
    width: { ideal: 640, max: 854 },
    height: { ideal: 360, max: 480 },
    frameRate: { ideal: 15, max: 20 },
    facingMode: 'user'
};
const AUDIO_CONSTRAINTS = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
    latency: 0
};

function getParticipantName(participant) {
    if (!participant) {
        return 'Guest';
    }

    return typeof participant === 'string' ? participant : participant.name;
}

function getParticipantCameraState(participant) {
    if (!participant || typeof participant === 'string') {
        return true;
    }

    return participant.cameraOn !== false;
}

function getParticipantHandState(participant) {
    if (!participant || typeof participant === 'string') {
        return false;
    }

    return participant.handRaised === true;
}

function getParticipantDisplayName(participant) {
    const name = getParticipantName(participant);
    return getParticipantHandState(participant) ? `${name} | Hand raised` : name;
}

function setParticipant(id, name, cameraState = true, handState = null) {
    const existing = participants.get(id);
    participants.set(id, {
        name: name || getParticipantName(existing),
        cameraOn: cameraState,
        handRaised: handState === null ? getParticipantHandState(existing) : handState
    });
}

function setParticipantCameraState(id, cameraState) {
    const existing = participants.get(id);
    participants.set(id, {
        name: getParticipantName(existing),
        cameraOn: cameraState,
        handRaised: getParticipantHandState(existing)
    });
}

function setParticipantHandState(id, handState) {
    const existing = participants.get(id);
    participants.set(id, {
        name: getParticipantName(existing),
        cameraOn: getParticipantCameraState(existing),
        handRaised: handState
    });
}

function getUserInitials(name) {
    const parts = String(name || 'Guest')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return 'G';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 1).toUpperCase();
    }

    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function getUserColor(name) {
    const palette = [
        ['#1f3c88', '#39a0ed'],
        ['#7b2cbf', '#c77dff'],
        ['#0f766e', '#34d399'],
        ['#b45309', '#f59e0b'],
        ['#be123c', '#fb7185'],
        ['#1d4ed8', '#60a5fa'],
        ['#4338ca', '#818cf8'],
        ['#166534', '#4ade80']
    ];

    const key = String(name || 'Guest');
    let hash = 0;
    for (let index = 0; index < key.length; index += 1) {
        hash = ((hash << 5) - hash) + key.charCodeAt(index);
        hash |= 0;
    }

    return palette[Math.abs(hash) % palette.length];
}

function updateHeroVisibility(active) {
    heroIntro.classList.toggle('hidden', active);
    heroActions.classList.toggle('hidden', active);
    activeMeetingBar.classList.toggle('hidden', !active);
    videoStage.classList.toggle('hidden', !active);
}

function syncMeetingHeader() {
    if (meetingActive) {
        meetingTitle.textContent = currentMeetingTitle;
        meetingSubtitle.textContent = '';
        roomLabel.textContent = currentMeetingTitle;
        meetingScheduleRow.classList.add('hidden');
        meetingScheduleRow.hidden = true;
        return;
    }

    meetingTitle.textContent = 'Create a live meeting';
    meetingSubtitle.textContent = 'Start a new call, invite participants, and use real meeting controls.';
    roomLabel.textContent = 'Ready to start';

    if (pendingSchedule?.start && pendingSchedule?.end) {
        meetingStartDisplay.textContent = formatDateTimeDisplay(pendingSchedule.start);
        meetingEndDisplay.textContent = formatDateTimeDisplay(pendingSchedule.end);
        meetingScheduleRow.classList.remove('hidden');
        meetingScheduleRow.hidden = false;
        meetingSubtitle.textContent = `Scheduled from ${formatDateTimeDisplay(pendingSchedule.start)} to ${formatDateTimeDisplay(pendingSchedule.end)}.`;
        return;
    }

    meetingStartDisplay.textContent = '';
    meetingEndDisplay.textContent = '';
    meetingScheduleRow.classList.add('hidden');
    meetingScheduleRow.hidden = true;
}

function setMeetingTimeLabel(text) {
    meetingTimeLabel.textContent = text;
}

function setNetworkQuality(label, state = 'good') {
    networkQualityLabel.textContent = `Connection: ${label}`;
    networkQualityLabel.classList.toggle('disconnected', state === 'poor' || state === 'offline');
}

function padNumber(value) {
    return String(value).padStart(2, '0');
}

function formatElapsedTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
    }

    return `${padNumber(minutes)}:${padNumber(seconds)}`;
}

function startMeetingClock() {
    clearInterval(meetingTimerInterval);
    meetingStartedAt = Date.now();
    setMeetingTimeLabel(`Live ${formatElapsedTime(0)}`);
    meetingTimerInterval = setInterval(() => {
        setMeetingTimeLabel(`Live ${formatElapsedTime(Date.now() - meetingStartedAt)}`);
    }, 1000);
}

function stopMeetingClock() {
    clearInterval(meetingTimerInterval);
    meetingTimerInterval = null;
    meetingStartedAt = null;
}

function formatDateTimeDisplay(value) {
    const date = new Date(value);
    return date.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function setMeetingFormDefaults() {
    meetingStartDateInput.value = '';
    meetingStartTimeInput.value = '';
    meetingEndDateInput.value = '';
    meetingEndTimeInput.value = '';
}

function getScheduledRange() {
    const values = [
        meetingStartDateInput.value,
        meetingStartTimeInput.value,
        meetingEndDateInput.value,
        meetingEndTimeInput.value
    ];

    if (!values.some(Boolean)) {
        return { start: null, end: null };
    }

    if (!values.every(Boolean)) {
        return null;
    }

    const start = new Date(`${meetingStartDateInput.value}T${meetingStartTimeInput.value}`);
    const end = new Date(`${meetingEndDateInput.value}T${meetingEndTimeInput.value}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return null;
    }

    return { start, end };
}

function showEmptyState() {
    const hasVideo = videoGrid.querySelectorAll('.video-card').length > 0;
    emptyState.classList.toggle('hidden', hasVideo);
}

function setStatus(text) {
    meetingStatus.textContent = text;
}

function closeMenu() {
    menuPopup.classList.add('hidden');
}

function updateControls() {
    micButton.classList.toggle('active', micOn);
    cameraButton.classList.toggle('active', cameraOn);
    screenButton.classList.toggle('active', screenSharing);
    menuButton.classList.toggle('active', !menuPopup.classList.contains('hidden'));
    chatToggleButton.classList.toggle('active', activeTool === 'chat');
    recordToggleButton.classList.toggle('active', activeTool === 'record');
    participantsToggleButton.classList.toggle('active', activeTool === 'participants');
    raiseHandButton.classList.toggle('active', handRaised);
    raiseHandButton.querySelector('span').textContent = handRaised ? 'Lower hand' : 'Raise hand';

    micButton.disabled = !meetingActive;
    cameraButton.disabled = !meetingActive;
    screenButton.disabled = !meetingActive;
    leaveCallButton.disabled = !meetingActive;
    menuButton.disabled = !meetingActive;
    chatToggleButton.disabled = !meetingActive;
    recordToggleButton.disabled = !meetingActive;
    participantsToggleButton.disabled = !meetingActive;
    raiseHandButton.disabled = !meetingActive;
    copyLinkButton.disabled = !meetingActive;
    floatVideoButton.disabled = !meetingActive;
    createMeetingBtn.disabled = creatingMeeting;
    startRecordBtn.disabled = !meetingActive || recorder !== null;
    stopRecordBtn.disabled = recorder === null;
}

function appendToolEmptyState(container, message) {
    container.innerHTML = '';
    const state = document.createElement('div');
    state.className = 'tool-empty';
    state.textContent = message;
    container.appendChild(state);
}

function clearChatMessages() {
    appendToolEmptyState(chatMessages, 'Messages will appear here once the meeting starts.');
}

function appendChatMessage(message, isOwnMessage) {
    const hasOnlyEmptyState = chatMessages.children.length === 1
        && chatMessages.firstElementChild.classList.contains('tool-empty');

    if (hasOnlyEmptyState) {
        chatMessages.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'chat-message';

    const sender = document.createElement('strong');
    sender.textContent = isOwnMessage ? `${message.sender} (You)` : message.sender;

    const text = document.createElement('p');
    text.textContent = message.text;

    const meta = document.createElement('div');
    meta.className = 'chat-message-meta';
    meta.textContent = new Date(message.sentAt).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });

    item.appendChild(sender);
    item.appendChild(text);
    item.appendChild(meta);
    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderParticipants() {
    participantsCount.textContent = String(participants.size);

    if (participants.size === 0) {
        appendToolEmptyState(participantsList, 'Join a meeting to see participants.');
        return;
    }

    participantsList.innerHTML = '';
    participants.forEach((participant, id) => {
        const item = document.createElement('div');
        item.className = 'participant-item';

        const info = document.createElement('div');
        const title = document.createElement('strong');
        const subtitle = document.createElement('span');

        title.textContent = getParticipantName(participant);
        subtitle.textContent = id;

        info.appendChild(title);
        info.appendChild(subtitle);
        item.appendChild(info);

        if (getParticipantHandState(participant)) {
            const handStatus = document.createElement('span');
            handStatus.className = 'participant-hand-status';
            handStatus.textContent = 'Hand raised';
            item.appendChild(handStatus);
        }

        participantsList.appendChild(item);
    });
}

function renderToolPanels() {
    const open = Boolean(activeTool && meetingActive);
    meetingToolsPanel.classList.toggle('hidden', !open);
    chatPanel.classList.toggle('hidden', activeTool !== 'chat');
    recordPanel.classList.toggle('hidden', activeTool !== 'record');
    participantsPanel.classList.toggle('hidden', activeTool !== 'participants');
    updateControls();
}

function toggleToolPanel(toolName) {
    if (!meetingActive) {
        return;
    }

    activeTool = activeTool === toolName ? null : toolName;
    renderToolPanels();
    closeMenu();
    updateControls();
}

function closeToolPanel() {
    activeTool = null;
    renderToolPanels();
    closeMenu();
    updateControls();
}

function createVideoCard(id, labelText, isLocal = false) {
    const card = document.createElement('div');
    card.className = `video-card video-on${isLocal ? ' local-host' : ''}`;
    card.id = `video-${id}`;

    const label = document.createElement('span');
    label.className = 'video-label';
    label.textContent = labelText;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = isLocal;
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    if (isLocal) {
        video.setAttribute('muted', '');
    }
    video.disablePictureInPicture = false;
    video.onloadedmetadata = () => {
        video.play().catch(() => {});
    };

    const avatar = document.createElement('div');
    avatar.className = 'video-avatar';

    card.appendChild(label);
    card.appendChild(video);
    card.appendChild(avatar);
    videoGrid.appendChild(card);
    showEmptyState();

    return { card, video, avatar };
}

function updateVideoCardAppearance(card, labelText, cameraState) {
    const avatar = card.querySelector('.video-avatar');
    const participantId = card.id.replace('video-', '');
    const participant = participantId === 'local'
        ? participants.get(currentSocketId)
        : participants.get(participantId);
    const avatarName = getParticipantName(participant) || labelText;
    const initials = getUserInitials(avatarName);
    const [colorA, colorB] = getUserColor(avatarName);

    avatar.textContent = initials;
    avatar.style.background = `linear-gradient(145deg, ${colorA} 0%, ${colorB} 100%)`;
    card.classList.toggle('video-on', cameraState);
    card.classList.toggle('video-off', !cameraState);
    card.classList.toggle('hand-raised', getParticipantHandState(participant));
}

function addOrUpdateVideoStream(id, stream, labelText, isLocal = false, cameraState = true) {
    let card = document.getElementById(`video-${id}`);
    let video;

    if (!card) {
        ({ card, video } = createVideoCard(id, labelText, isLocal));
    } else {
        video = card.querySelector('video');
        card.querySelector('.video-label').textContent = labelText;
    }

    if (id === 'local' && (!stream || stream.getTracks().length === 0)) {
        video.pause();
        video.srcObject = null;
    }

    if (video.srcObject !== stream) {
        video.pause();
        video.srcObject = stream;
    }
    video.muted = isLocal;
    if (isLocal) {
        video.setAttribute('muted', '');
    }
    video.defaultMuted = isLocal;
    requestAnimationFrame(() => {
        video.play().catch(() => {});
    });
    updateVideoCardAppearance(card, labelText, cameraState);
}

function updateVideoCardState(id, labelText, cameraState) {
    const card = document.getElementById(`video-${id}`);
    if (!card) {
        return;
    }

    card.querySelector('.video-label').textContent = labelText;
    updateVideoCardAppearance(card, labelText, cameraState);
}

function removeVideoStream(id) {
    const card = document.getElementById(`video-${id}`);
    if (card) {
        const video = card.querySelector('video');
        if (video?.srcObject instanceof MediaStream) {
            video.srcObject = null;
        }
        card.remove();
    }
    showEmptyState();
}

function getEffectiveLocalVideoTrack() {
    return localStream?.getVideoTracks()[0] || null;
}

function getEffectiveLocalAudioTrack() {
    return mediaStream?.getAudioTracks()[0] || null;
}

async function optimizeVideoTrack(track, isScreenShare = false, constraintsOverride = null) {
    if (!track) {
        return;
    }

    track.contentHint = isScreenShare ? 'detail' : 'motion';

    try {
        await track.applyConstraints(constraintsOverride || (isScreenShare ? {
            frameRate: { ideal: 12, max: 15 }
        } : CAMERA_CONSTRAINTS));
    } catch {}
}

async function optimizeAudioTrack(track) {
    if (!track) {
        return;
    }

    track.contentHint = 'speech';

    try {
        await track.applyConstraints({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
        });
    } catch {}
}

function optimizeSender(sender, kind, isScreenShare = false) {
    if (!sender || typeof sender.getParameters !== 'function' || typeof sender.setParameters !== 'function') {
        return;
    }

    const parameters = sender.getParameters();
    if (!parameters.encodings || parameters.encodings.length === 0) {
        parameters.encodings = [{}];
    }

    if (kind === 'video') {
        parameters.degradationPreference = isScreenShare ? 'maintain-resolution' : 'maintain-framerate';
        parameters.encodings[0].maxBitrate = isScreenShare ? 3000000 : 2500000;
        parameters.encodings[0].maxFramerate = isScreenShare ? 30 : 30;
    }

    if (kind === 'audio') {
        parameters.encodings[0].maxBitrate = 128000;
    }

    sender.setParameters(parameters).catch(() => {});
}

function optimizePeerSenders(connection) {
    const localVideoTrack = getEffectiveLocalVideoTrack();
    connection.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
            optimizeSender(sender, 'video', Boolean(screenSharing && localVideoTrack === screenShareStream?.getVideoTracks?.()[0]));
        }

        if (sender.track?.kind === 'audio') {
            optimizeSender(sender, 'audio');
        }
    });
}

async function setQualityMode(mode) {
    if (currentQualityMode === mode || screenSharing) {
        return;
    }

    currentQualityMode = mode;
    const cameraTrack = mediaStream?.getVideoTracks()[0];
    if (!cameraTrack) {
        return;
    }

    const constraints = mode === 'low' ? LOW_BANDWIDTH_CAMERA_CONSTRAINTS : CAMERA_CONSTRAINTS;
    await optimizeVideoTrack(cameraTrack, false, constraints);
    await replaceOutgoingTrack('video', getEffectiveLocalVideoTrack(), false);
    refreshLocalPreview();
}

async function sampleConnectionQuality() {
    const connections = Object.values(peers).filter(Boolean);
    if (!meetingActive || connections.length === 0) {
        setNetworkQuality(meetingActive ? 'Ready' : 'Offline', meetingActive ? 'good' : 'offline');
        return;
    }

    let totalRtt = 0;
    let totalLoss = 0;
    let samples = 0;

    for (const connection of connections) {
        try {
            const stats = await connection.getStats();
            stats.forEach((report) => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime) {
                    totalRtt += report.currentRoundTripTime;
                    samples += 1;
                }

                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    totalLoss += report.packetsLost || 0;
                }
            });
        } catch {}
    }

    const averageRttMs = samples > 0 ? (totalRtt / samples) * 1000 : 0;

    if (averageRttMs > 450 || totalLoss > 80) {
        setNetworkQuality('Poor', 'poor');
        return;
    }

    if (averageRttMs > 220 || totalLoss > 20) {
        setNetworkQuality('Fair', 'good');
        return;
    }

    setNetworkQuality('Good', 'good');
    await setQualityMode('standard');
}

function startNetworkMonitor() {
    clearInterval(networkMonitorInterval);
    setNetworkQuality('Ready', 'good');
    networkMonitorInterval = setInterval(() => {
        sampleConnectionQuality().catch(() => {});
    }, 4000);
    sampleConnectionQuality().catch(() => {});
}

function stopNetworkMonitor() {
    clearInterval(networkMonitorInterval);
    networkMonitorInterval = null;
    currentQualityMode = 'standard';
    setNetworkQuality('Offline', 'offline');
}

function hasOutgoingVideo() {
    return Boolean(getEffectiveLocalVideoTrack()) && (cameraOn || screenSharing);
}

function hasLocalPreviewVideo() {
    return Boolean(localPreviewStream?.getVideoTracks().length);
}

function buildOutgoingStream() {
    const tracks = [];
    const videoTrack = getEffectiveLocalVideoTrack();
    const audioTrack = getEffectiveLocalAudioTrack();

    if (videoTrack && hasOutgoingVideo()) {
        tracks.push(videoTrack);
    }

    if (audioTrack) {
        tracks.push(audioTrack);
    }

    return new MediaStream(tracks);
}

function buildPreviewStream() {
    if (!hasOutgoingVideo()) {
        return new MediaStream();
    }

    if (screenSharing && screenShareStream) {
        if (!cameraOn) {
            return new MediaStream();
        }
        return screenShareStream;
    }

    return mediaStream || new MediaStream();
}

function refreshLocalPreview() {
    if (!meetingActive) {
        return;
    }

    localPreviewStream = buildPreviewStream();
    addOrUpdateVideoStream(
        'local',
        localPreviewStream,
        getParticipantDisplayName(participants.get(currentSocketId)) || userName,
        true,
        hasLocalPreviewVideo()
    );
}

async function getLocalMedia() {
    const mediaProfiles = [
        { video: CAMERA_CONSTRAINTS, audio: AUDIO_CONSTRAINTS },
        { video: true, audio: AUDIO_CONSTRAINTS },
        { video: true, audio: true }
    ];

    try {
        let capturedStream = null;

        for (const profile of mediaProfiles) {
            try {
                capturedStream = await navigator.mediaDevices.getUserMedia(profile);
                if (capturedStream.getVideoTracks().length > 0) {
                    break;
                }
            } catch {}
        }

        if (!capturedStream) {
            throw new Error('Could not capture media.');
        }

        mediaStream = capturedStream;

        localStream = mediaStream;
        await Promise.all(mediaStream.getAudioTracks().map((track) => optimizeAudioTrack(track)));
        mediaStream.getAudioTracks().forEach((track) => {
            track.enabled = micOn;
        });
        await Promise.all(localStream.getVideoTracks().map((track) => optimizeVideoTrack(track, false)));
        localStream.getVideoTracks().forEach((track) => {
            track.enabled = cameraOn;
        });

        if (localStream.getVideoTracks().length === 0) {
            alert('Camera permission was not granted or no camera was found. Allow camera access in the browser and try again.');
            return false;
        }

        return true;
    } catch {
        alert('Could not access camera and microphone. Check browser permissions.');
        return false;
    }
}

function initSocket() {
    if (socket) {
        return;
    }

    socket = io('http://localhost:3000', { autoConnect: true });

    socket.on('connect', () => {
        currentSocketId = socket.id;
        joinCurrentRoomIfNeeded();
    });

    socket.on('room-users', async (users) => {
        for (const user of users) {
            setParticipant(
                user.userId,
                user.userName || 'Guest',
                user.cameraOn !== false,
                user.handRaised === true
            );
            renderParticipants();
            await createPeerConnection(user.userId, user.userName || 'Guest', true);
        }
        setStatus(screenSharing ? 'Presenting' : 'Live');
    });

    socket.on('user-connected', (userId, remoteName, remoteCameraOn = true) => {
        setParticipant(userId, remoteName || 'Guest', remoteCameraOn, false);
        renderParticipants();
    });

    socket.on('user-disconnected', (userId) => {
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
        }

        participants.delete(userId);
        renderParticipants();
        removeVideoStream(userId);
    });

    socket.on('chat-message', (message) => {
        appendChatMessage(message, false);
    });

    socket.on('camera-state-changed', ({ userId, cameraOn: remoteCameraOn }) => {
        setParticipantCameraState(userId, remoteCameraOn);
        renderParticipants();
        updateVideoCardState(userId, getParticipantDisplayName(participants.get(userId)), remoteCameraOn);
    });

    socket.on('hand-state-changed', ({ userId, handRaised: remoteHandRaised }) => {
        setParticipantHandState(userId, remoteHandRaised);
        renderParticipants();
        updateVideoCardState(
            userId,
            getParticipantDisplayName(participants.get(userId)),
            getParticipantCameraState(participants.get(userId))
        );
    });

    socket.on('webrtc-offer', async ({ fromUserId, userName: remoteName, offer }) => {
        setParticipant(fromUserId, remoteName || 'Guest', true, false);
        renderParticipants();

        const connection = await createPeerConnection(fromUserId, remoteName || 'Guest', false);
        await connection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
            targetUserId: fromUserId,
            answer
        });
    });

    socket.on('webrtc-answer', async ({ fromUserId, answer }) => {
        const connection = peers[fromUserId];
        if (!connection) {
            return;
        }

        await connection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('webrtc-ice-candidate', async ({ fromUserId, candidate }) => {
        const connection = peers[fromUserId];
        if (!connection || !candidate) {
            return;
        }

        try {
            await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
    });
}

function joinCurrentRoomIfNeeded() {
    if (!socket || !socket.connected || !meetingActive || !currentRoomId) {
        return;
    }

    if (joinedSocketRoomId === currentRoomId) {
        return;
    }

    currentSocketId = socket.id;
    setParticipant(currentSocketId, `${userName} (You)`, hasOutgoingVideo(), handRaised);
    renderParticipants();
    socket.emit('join-room', currentRoomId, userName, hasOutgoingVideo());
    joinedSocketRoomId = currentRoomId;
    setStatus(screenSharing ? 'Presenting' : 'Live');
}

async function createPeerConnection(userId, remoteName, shouldCreateOffer) {
    if (peers[userId]) {
        return peers[userId];
    }

    const connection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 4
    });

    const outgoingStream = buildOutgoingStream();
    const remoteStream = new MediaStream();
    const remoteParticipant = participants.get(userId);
    const remoteCameraOn = getParticipantCameraState(remoteParticipant);

    addOrUpdateVideoStream(
        userId,
        remoteStream,
        remoteParticipant ? getParticipantDisplayName(remoteParticipant) : remoteName,
        false,
        remoteCameraOn
    );

    const audioTrack = getEffectiveLocalAudioTrack();
    const videoTrack = getEffectiveLocalVideoTrack();

    if (audioTrack) {
        connection.addTrack(audioTrack, outgoingStream);
    }

    if (videoTrack) {
        connection.addTrack(videoTrack, outgoingStream);
    }

    optimizePeerSenders(connection);

    connection.ontrack = (event) => {
        event.streams.forEach((stream) => {
            stream.getTracks().forEach((track) => {
                if (!remoteStream.getTracks().some((item) => item.id === track.id)) {
                    remoteStream.addTrack(track);
                }
            });
        });

        addOrUpdateVideoStream(
            userId,
            remoteStream,
            getParticipantDisplayName(participants.get(userId)),
            false,
            getParticipantCameraState(participants.get(userId))
        );
    };

    connection.onicecandidate = (event) => {
        if (!event.candidate || !socket) {
            return;
        }

        socket.emit('webrtc-ice-candidate', {
            targetUserId: userId,
            candidate: event.candidate
        });
    };

    connection.onconnectionstatechange = () => {
        if (connection.connectionState === 'connected') {
            sampleConnectionQuality().catch(() => {});
        }

        if (['failed', 'closed', 'disconnected'].includes(connection.connectionState)) {
            connection.close();
            delete peers[userId];
            participants.delete(userId);
            renderParticipants();
            removeVideoStream(userId);
            sampleConnectionQuality().catch(() => {});
        }
    };

    peers[userId] = connection;

    if (shouldCreateOffer) {
        const offer = await connection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            voiceActivityDetection: true
        });
        await connection.setLocalDescription(offer);

        socket.emit('webrtc-offer', {
            roomId: currentRoomId,
            targetUserId: userId,
            userName,
            offer
        });
    }

    return connection;
}

function getSenderForKind(connection, kind) {
    const directSender = connection.getSenders().find((item) => item.track?.kind === kind);
    if (directSender) {
        return directSender;
    }

    const transceiver = connection.getTransceivers().find((item) => {
        return item.sender && (item.sender.track?.kind === kind || item.receiver.track?.kind === kind);
    });

    return transceiver?.sender || null;
}

async function replaceOutgoingTrack(kind, track, isScreenShareTrack = false) {
    await Promise.all(Object.values(peers).map(async (connection) => {
        const sender = getSenderForKind(connection, kind);
        if (sender) {
            await sender.replaceTrack(track);
            optimizeSender(sender, kind, kind === 'video' && isScreenShareTrack);
        }
    }));
}

function stopRecording(resetState = false) {
    if (recorder) {
        recorder.stop();
    }

    if (resetState) {
        recorder = null;
        recorderChunks = [];
        if (recorderUrl) {
            URL.revokeObjectURL(recorderUrl);
            recorderUrl = null;
        }
        recordDownloadLink.classList.add('hidden');
        recordDownloadLink.removeAttribute('href');
        recordStatusText.textContent = 'Recorder idle.';
        updateControls();
    }
}

function resetMeetingUi() {
    Object.values(peers).forEach((connection) => connection.close());
    peers = {};

    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
    }

    if (screenShareStream) {
        screenShareStream.getTracks().forEach((track) => track.stop());
        screenShareStream = null;
    }

    joinedSocketRoomId = null;
    currentRoomId = null;
    currentSocketId = null;
    meetingActive = false;
    micOn = true;
    cameraOn = true;
    screenSharing = false;
    activeTool = null;
    participants = new Map();
    handRaised = false;
    currentMeetingTitle = 'Create a live meeting';
    pendingSchedule = null;
    if (localPreviewStream) {
        localPreviewStream.getTracks().forEach((track) => track.stop());
        localPreviewStream = null;
    }

    videoGrid.querySelectorAll('.video-card').forEach((card) => card.remove());
    showEmptyState();
    clearChatMessages();
    renderParticipants();
    renderToolPanels();
    stopRecording(true);
    stopMeetingClock();
    stopNetworkMonitor();
    updateHeroVisibility(false);
    closeMenu();
    syncMeetingHeader();
    setStatus('Offline');
    setMeetingTimeLabel('No time set');
    creatingMeeting = false;
    updateControls();
}

async function connectMeetingTransport() {
    initSocket();
    if (socket.connected) {
        joinCurrentRoomIfNeeded();
    }
}

async function startMeeting(roomId, title, name, schedule = null) {
    if (creatingMeeting) {
        return;
    }

    creatingMeeting = true;
    updateControls();

    if (meetingActive) {
        leaveMeeting();
    }

    currentRoomId = roomId;
    userName = name;
    joinedSocketRoomId = null;
    currentMeetingTitle = title;
    pendingSchedule = schedule?.start && schedule?.end ? schedule : null;

    const mediaReady = await getLocalMedia();
    if (!mediaReady) {
        creatingMeeting = false;
        currentMeetingTitle = 'Create a live meeting';
        updateControls();
        return;
    }

    meetingActive = true;
    activeTool = null;
    participants = new Map();
    clearChatMessages();
    renderParticipants();
    updateHeroVisibility(true);
    refreshLocalPreview();
    syncMeetingHeader();
    setStatus('Live');
    startMeetingClock();
    startNetworkMonitor();
    creatingMeeting = false;
    renderToolPanels();
    updateControls();
    closeModal();
    closeJoinModal();
    await connectMeetingTransport();
}

function generateMeetingId() {
    return Math.random().toString(36).slice(2, 10);
}

async function createMeeting() {
    const title = meetingNameInput.value.trim() || 'Meeting room';
    const schedule = getScheduledRange();

    if (!schedule) {
        alert('Please complete both start and end time, or leave all schedule fields empty.');
        return;
    }

    await startMeeting(generateMeetingId(), title, 'Host', schedule);
}

function parseMeetingCode(value) {
    if (!value) {
        return '';
    }

    try {
        const parsed = new URL(value);
        return parsed.searchParams.get('room') || value.trim();
    } catch {
        return value.trim();
    }
}

async function joinMeeting() {
    const code = parseMeetingCode(joinCodeInput.value);
    if (!code) {
        alert('Please enter a meeting code or link.');
        return;
    }

    const guestName = userNameInput.value.trim() || 'Guest';
    await startMeeting(code, `Meeting ${code}`, guestName);
}

function leaveMeeting() {
    if (socket && socket.connected && currentRoomId) {
        socket.emit('leave-room', currentRoomId);
    }

    resetMeetingUi();
}

function toggleRaiseHand() {
    if (!meetingActive) {
        return;
    }

    handRaised = !handRaised;
    if (currentSocketId) {
        setParticipant(currentSocketId, `${userName} (You)`, hasOutgoingVideo(), handRaised);
        updateVideoCardState('local', getParticipantDisplayName(participants.get(currentSocketId)), hasOutgoingVideo());
    }
    if (socket && socket.connected && currentRoomId) {
        socket.emit('hand-state-changed', currentRoomId, handRaised);
    }
    renderParticipants();
    setStatus(handRaised ? 'Hand raised' : (screenSharing ? 'Presenting' : 'Live'));
    closeMenu();
    updateControls();
}

async function copyMeetingLink() {
    if (!currentRoomId) {
        alert('Start or join a meeting to copy the link.');
        return;
    }

    const link = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(currentRoomId)}`;

    try {
        await navigator.clipboard.writeText(link);
        setStatus('Meeting link copied');
    } catch {
        alert(`Copy this meeting link: ${link}`);
    }

    closeMenu();
}

async function toggleFloatVideo() {
    const localVideo = document.querySelector('#video-local video');
    if (!localVideo) {
        alert('Start or join a meeting to float the video.');
        return;
    }

    if (!document.pictureInPictureEnabled || typeof localVideo.requestPictureInPicture !== 'function') {
        alert('Floating video is not supported in this browser.');
        return;
    }

    try {
        if (document.pictureInPictureElement === localVideo) {
            await document.exitPictureInPicture();
        } else {
            await localVideo.requestPictureInPicture();
        }
    } catch {
        alert('Could not open floating video mode.');
    }

    closeMenu();
}

function toggleMic() {
    if (!mediaStream) {
        if (!meetingActive) {
            alert('Start or join a meeting to use the microphone.');
        }
        return;
    }

    micOn = !micOn;
    mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
    });
    updateControls();
}

async function toggleCamera() {
    if (!localStream) {
        if (!meetingActive) {
            alert('Start or join a meeting to use the camera.');
        }
        return;
    }

    cameraOn = !cameraOn;
    localStream.getVideoTracks().forEach((track) => {
        track.enabled = cameraOn;
    });
    if (currentSocketId) {
        setParticipant(currentSocketId, `${userName} (You)`, hasOutgoingVideo(), handRaised);
    }
    await replaceOutgoingTrack('video', getEffectiveLocalVideoTrack(), false);
    if (socket && socket.connected && currentRoomId) {
        socket.emit('camera-state-changed', currentRoomId, hasOutgoingVideo());
    }
    refreshLocalPreview();
    renderParticipants();
    updateControls();
}

async function toggleScreenShare() {
    if (!meetingActive) {
        alert('Start or join a meeting to share your screen.');
        return;
    }

    try {
        if (screenSharing && screenShareStream) {
            const cameraTrack = mediaStream?.getVideoTracks()[0];
            if (cameraTrack) {
                localStream = mediaStream;
                cameraTrack.enabled = cameraOn;
                await replaceOutgoingTrack('video', cameraTrack, false);
            }

            screenShareStream.getTracks().forEach((track) => track.stop());
            screenShareStream = null;
            screenSharing = false;
            if (currentSocketId) {
                setParticipant(currentSocketId, `${userName} (You)`, hasOutgoingVideo(), handRaised);
            }
            if (socket && socket.connected && currentRoomId) {
                socket.emit('camera-state-changed', currentRoomId, hasOutgoingVideo());
            }
            setStatus('Live');
            refreshLocalPreview();
            renderParticipants();
            updateControls();
            return;
        }

        screenShareStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenShareStream.getVideoTracks()[0];

        if (!screenTrack) {
            screenShareStream.getTracks().forEach((track) => track.stop());
            screenShareStream = null;
            return;
        }

        localStream = screenShareStream;
        await optimizeVideoTrack(screenTrack, true);
        screenTrack.enabled = true;
        await replaceOutgoingTrack('video', screenTrack, true);
        screenSharing = true;
        if (currentSocketId) {
            setParticipant(currentSocketId, `${userName} (You)`, hasOutgoingVideo(), handRaised);
        }
        if (socket && socket.connected && currentRoomId) {
            socket.emit('camera-state-changed', currentRoomId, hasOutgoingVideo());
        }
        setStatus('Presenting');
        refreshLocalPreview();
        renderParticipants();
        updateControls();

        screenTrack.onended = () => {
            if (screenSharing) {
                toggleScreenShare();
            }
        };
    } catch {
        if (screenShareStream) {
            screenShareStream.getTracks().forEach((track) => track.stop());
            screenShareStream = null;
        }

        alert('Could not share your screen.');
    }
}

function startRecording() {
    if (!meetingActive || recorder) {
        return;
    }

    const tracks = [];
    const videoTrack = recordVideoToggle.checked ? getEffectiveLocalVideoTrack() : null;
    const audioTrack = recordAudioToggle.checked ? getEffectiveLocalAudioTrack() : null;

    if (videoTrack) {
        tracks.push(videoTrack);
    }

    if (audioTrack) {
        tracks.push(audioTrack);
    }

    if (tracks.length === 0) {
        alert('Select audio, video, or both before starting the recording.');
        return;
    }

    recorderChunks = [];
    recordStatusText.textContent = 'Recording in progress...';
    recordDownloadLink.classList.add('hidden');
    recorder = new MediaRecorder(new MediaStream(tracks));

    recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recorderChunks.push(event.data);
        }
    };

    recorder.onstop = () => {
        if (recorderUrl) {
            URL.revokeObjectURL(recorderUrl);
        }

        if (recorderChunks.length > 0) {
            recorderUrl = URL.createObjectURL(new Blob(recorderChunks, { type: 'video/webm' }));
            recordDownloadLink.href = recorderUrl;
            recordDownloadLink.classList.remove('hidden');
            recordStatusText.textContent = 'Recording saved. Download it below.';
        } else {
            recordStatusText.textContent = 'No recording data was captured.';
        }

        recorder = null;
        updateControls();
    };

    recorder.start();
    updateControls();
}

function sendChatMessage(event) {
    event.preventDefault();

    if (!socket || !currentRoomId) {
        return;
    }

    const text = chatInput.value.trim();
    if (!text) {
        return;
    }

    const message = {
        sender: userName,
        text,
        sentAt: new Date().toISOString()
    };

    appendChatMessage(message, true);
    socket.emit('chat-message', currentRoomId, message);
    chatInput.value = '';
}

function openModal() {
    setMeetingFormDefaults();
    newMeetingModal.classList.remove('hidden');
    requestAnimationFrame(() => meetingNameInput.focus());
}

function closeModal() {
    newMeetingModal.classList.add('hidden');
}

function openJoinModal() {
    joinMeetingModal.classList.remove('hidden');
    requestAnimationFrame(() => joinCodeInput.focus());
}

function closeJoinModal() {
    joinMeetingModal.classList.add('hidden');
}

function toggleMenuButton() {
    menuPopup.classList.toggle('hidden');
    updateControls();
}

newMeetingBtn.addEventListener('click', openModal);
newMeetingOpenBtn.addEventListener('click', openModal);
joinMeetingBtn.addEventListener('click', openJoinModal);
createMeetingBtn.addEventListener('click', createMeeting);
cancelMeetingBtn.addEventListener('click', closeModal);
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}
cancelJoinBtn.addEventListener('click', closeJoinModal);
closeJoinModalBtn.addEventListener('click', closeJoinModal);
joinMeetingConfirmBtn.addEventListener('click', joinMeeting);
micButton.addEventListener('click', toggleMic);
cameraButton.addEventListener('click', toggleCamera);
screenButton.addEventListener('click', toggleScreenShare);
leaveCallButton.addEventListener('click', leaveMeeting);
chatToggleButton.addEventListener('click', () => toggleToolPanel('chat'));
recordToggleButton.addEventListener('click', () => toggleToolPanel('record'));
participantsToggleButton.addEventListener('click', () => toggleToolPanel('participants'));
raiseHandButton.addEventListener('click', toggleRaiseHand);
copyLinkButton.addEventListener('click', copyMeetingLink);
floatVideoButton.addEventListener('click', toggleFloatVideo);
menuButton.addEventListener('click', toggleMenuButton);
chatForm.addEventListener('submit', sendChatMessage);
startRecordBtn.addEventListener('click', startRecording);
stopRecordBtn.addEventListener('click', () => stopRecording(false));
toolCloseButtons.forEach((button) => {
    button.addEventListener('click', closeToolPanel);
});

document.addEventListener('click', (event) => {
    if (!menuPopup.contains(event.target) && !menuButton.contains(event.target)) {
        closeMenu();
        updateControls();
    }
});

newMeetingModal.addEventListener('click', (event) => {
    if (event.target === newMeetingModal) {
        closeModal();
    }
});

joinMeetingModal.addEventListener('click', (event) => {
    if (event.target === joinMeetingModal) {
        closeJoinModal();
    }
});

meetingNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        createMeeting();
    }
});

joinCodeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        joinMeeting();
    }
});

userNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        joinMeeting();
    }
});

const pageParams = new URLSearchParams(window.location.search);
const roomParam = pageParams.get('room');
const startParam = pageParams.get('start');
const endParam = pageParams.get('end');

if (roomParam) {
    joinCodeInput.value = roomParam;
    if (startParam && endParam) {
        const startDate = new Date(startParam);
        const endDate = new Date(endParam);

        if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
            pendingSchedule = { start: startDate, end: endDate };
            syncMeetingHeader();
        }
    }
    openJoinModal();
}

initSocket();
showEmptyState();
updateHeroVisibility(false);
syncMeetingHeader();
setMeetingTimeLabel('No time set');
setNetworkQuality('Offline', 'offline');
clearChatMessages();
renderParticipants();
renderToolPanels();
updateControls();
