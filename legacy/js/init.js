function init() {
    renderSetupPieces();
    renderDefaultLayout();
    updateClocks();
    updateClockSettings();
    bindEvents();
    loadSavedGames();
    updateStatusInfo();
    updateViewModeButtons();
    updateMarkButtons();
    updateFileStatus();
    updatePlayButtons();
}

init();

// ========== 事件绑定 ==========
        function bindEvents() {
            // 文件管理按钮
            newFileBtn.onclick = newFile;
            openFileBtn.onclick = openFile;
            saveFileBtn.onclick = saveFile;
            saveAsBtn.onclick = () => saveAsFile();
            
            // 处理传统文件选择
            document.getElementById('fileInput').onchange = function(e) {
                const file = e.target.files[0];
                if(!file) return;
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    currentFileHandle = null;
                    currentFileName = file.name;
                    isFileModified = false;
                    
                    parseFileContent(event.target.result);
                    updateFileStatus();
                };
                reader.readAsText(file);
                
                e.target.value = '';
            };
            
            // 原有按钮绑定
            document.getElementById('toggleSetupModeBtn').onclick = toggleSetupMode;
            document.getElementById('backToClockBtn').onclick = toggleSetupMode;
            document.getElementById('startGameBtn').onclick = startGame;
            document.getElementById('clearBoardBtn').onclick = () => chessGrid.innerHTML = '';
            document.getElementById('defaultGameBtn').onclick = renderDefaultLayout;
            document.getElementById('undoBtn').onclick = undoMove;
            document.getElementById('copyRecordBtn').onclick = copyRecord;
            document.getElementById('branchFromHereBtn').onclick = branchFromHere;
            document.getElementById('addCommentBtn').onclick = addComment;
            document.getElementById('saveCommentBtn').onclick = saveComment;
            
            // 标记按钮绑定
            markBranchBtn.onclick = function() {
                if (viewMode === 'current') {
                    markBranchPoint();
                } else if (viewMode === 'fragments') {
                    // 在片段集合模式下，如果选择了片段并且该片段处于编辑模式，则标记下划线
                    if (selectedFragmentIndex >= 0 && savedFragments[selectedFragmentIndex] && 
                        savedFragments[selectedFragmentIndex].editable) {
                        markUnderline();
                    } else {
                        alert('请先进入编辑模式并选择一个着法！');
                    }
                }
            };
            
            deleteBranchBtn.onclick = deleteBranchPoint;
            markUnderlineBtn.onclick = markUnderline;
            document.getElementById('mirrorRecordBtn').onclick = mirrorRecord;
            
            document.getElementById('flipBoardBtn').onclick = flipBoard;
            
            // 语音控制
            voiceToggle.onchange = function() {
                voiceEnabled = this.checked;
            };
            
            viewCurrentBtn.onclick = () => {
                if (isPlaying) stopPlay();
                switchViewMode('current');
            };
            viewFragmentsBtn.onclick = () => {
                if (isPlaying) stopPlay();
                switchViewMode('fragments');
            };
            
            // 播放按钮绑定
            playBtn.onclick = playCurrentFragment;
            playFragmentsBtn.onclick = playAllFragments;
            stopPlayBtn.onclick = stopPlay;
            
            document.getElementById('restoreGameBtn').onclick = restoreGame;
            document.getElementById('newGameBtn').onclick = newGame;
            document.getElementById('renameGameBtn').onclick = renameGame;
            document.getElementById('deleteGameBtn').onclick = deleteGame;
            document.getElementById('moveUpBtn').onclick = moveGameUp;
            document.getElementById('moveDownBtn').onclick = moveGameDown;
            document.getElementById('prevGameBtn').onclick = prevGame;
            document.getElementById('nextGameBtn').onclick = nextGame;
            
            gameSelect.onchange = function() {
                const gameId = parseInt(this.value);
                if (gameId) {
                    if (isPlaying) stopPlay();
                    loadGame(gameId);
                }
            };
            
            document.getElementById('chessContainer').onclick = handleBoardClick;
            
            document.getElementById('startClockBtn').onclick = () => {
                if(!clockRunning) {
                    startClock(currentTurn);
                }
            };
            document.getElementById('pauseClockBtn').onclick = pauseClock;
            document.getElementById('resetClockBtn').onclick = resetClock;
            
            bindClockSettingEvents();
        }
// ========== 加载已保存的棋局 ==========
        function loadSavedGames() {
            // 从本地存储加载已保存的棋局
            const saved = localStorage.getItem('xiangqiGames');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    savedGames = data.games || [];
                    if (savedGames.length > 0) {
                        loadGame(savedGames[0].id);
                    }
                } catch (e) {
                    console.error('加载棋局失败:', e);
                }
            }
        }
