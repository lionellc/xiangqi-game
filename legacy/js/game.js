// ========== 棋局管理功能 ==========
        function getCurrentBoardState() {
            const pieces = document.querySelectorAll('.chess-grid .chess-piece');
            const boardState = [];
            
            pieces.forEach(piece => {
                boardState.push({
                    type: piece.dataset.type,
                    color: piece.dataset.color,
                    row: parseInt(piece.dataset.row),
                    col: parseInt(piece.dataset.col)
                });
            });
            
            return boardState;
        }

        function loadGame(gameId) {
    const game = savedGames.find(g => g.id === gameId);
    if (!game) return;
    
    stopClock();
    chessGrid.innerHTML = '';
    
    currentLine = JSON.parse(JSON.stringify(game.currentLine || []));
    savedFragments = JSON.parse(JSON.stringify(game.fragments || []));
    currentGameId = game.id;
    comments = JSON.parse(JSON.stringify(game.comments || {}));
    branchPoints = JSON.parse(JSON.stringify(game.branchPoints || {}));
    gameNameInput.value = game.name;
    
    selectedMoveIndex = -1;
    selectedFragmentIndex = -1;
    selectedFragmentMoveIndex = -1;
    currentTurn = 'red';
    gameOver = false;
    gameMode = 'play';
    viewMode = 'current';
    updateViewModeButtons();
    
    isBoardFlipped = game.isFlipped || false;
    const chessContainer = document.getElementById('chessContainer');
    if (isBoardFlipped) {
        chessContainer.classList.add('flipped');
        flipBoardBtn.textContent = '恢复正放';
    } else {
        chessContainer.classList.remove('flipped');
        flipBoardBtn.textContent = '翻转棋盘';
    }
    
    currentLine.forEach((move, index) => {
        move.displayNum = index + 1;
    });
    
    // ========== 修复：确保所有片段都有underlineMarks属性 ==========
    savedFragments.forEach((fragment, fragmentIndex) => {
        fragment.title = fragment.title || `棋局${fragmentIndex + 1}`;
        if (!fragment.underlineMarks) {
            fragment.underlineMarks = {};
        }
    });
    // ========== 修复结束 ==========
    
    renderRecord();
    updateClocks();
    updateStatusInfo();
    updateMarkButtons();
    
    if (currentLine.length > 0) {
        currentMoveInfo.textContent = `第${currentLine.length}着`;
        showCommentForMove(currentLine.length - 1);
        replayBoard(currentLine.length - 1);
    } else {
        currentMoveInfo.textContent = '第0着';
        defaultLayout.forEach(p => createPiece(p.type, p.color, p.row, p.col));
    }
    
    gameSelect.value = gameId;
}

        function deleteGame() {
            if (currentGameId === 0) {
                alert('请先选择一个棋局！');
                return;
            }
            
            if (!confirm('确定要删除这个棋局吗？')) return;
            
            const index = savedGames.findIndex(g => g.id === currentGameId);
            if (index !== -1) {
                const deletedGame = savedGames.splice(index, 1)[0];
                deletedGames.push(deletedGame);
                
                savedGames.forEach((game, idx) => {
                    game.id = idx + 1;
                });
                
                // 标记文件已修改
                markFileModified();
                
                updateGameSelect();
                
                currentGameId = 0;
                renderDefaultLayout();
                gameNameInput.value = "未命名棋局";
                
                alert('棋局已删除！');
            }
        }

        function restoreGame() {
            if (deletedGames.length === 0) {
                alert('没有可恢复的棋局！');
                return;
            }
            
            const gameToRestore = deletedGames.pop();
            savedGames.push(gameToRestore);
            
            savedGames.forEach((game, idx) => {
                game.id = idx + 1;
            });
            
            // 标记文件已修改
            markFileModified();
            
            updateGameSelect();
            alert(`棋局"${gameToRestore.name}"已恢复！`);
        }

        function renameGame() {
            if (currentGameId === 0) {
                alert('请先选择一个棋局！');
                return;
            }
            
            const game = savedGames.find(g => g.id === currentGameId);
            if (!game) return;
            
            const newName = prompt('请输入新的棋局名称：', game.name);
            if (!newName) return;
            
            game.name = newName;
            gameNameInput.value = newName;
            
            // 标记文件已修改
            markFileModified();
            
            updateGameSelect();
            alert('棋局名称已更改！');
        }

        function moveGameUp() {
            if (currentGameId === 0) {
                alert('请先选择一个棋局！');
                return;
            }
            
            const index = savedGames.findIndex(g => g.id === currentGameId);
            if (index <= 0) return;
            
            [savedGames[index], savedGames[index - 1]] = [savedGames[index - 1], savedGames[index]];
            
            savedGames.forEach((game, idx) => {
                game.id = idx + 1;
            });
            
            // 标记文件已修改
            markFileModified();
            
            updateGameSelect();
        }

        function moveGameDown() {
            if (currentGameId === 0) {
                alert('请先选择一个棋局！');
                return;
            }
            
            const index = savedGames.findIndex(g => g.id === currentGameId);
            if (index >= savedGames.length - 1) return;
            
            [savedGames[index], savedGames[index + 1]] = [savedGames[index + 1], savedGames[index]];
            
            savedGames.forEach((game, idx) => {
                game.id = idx + 1;
            });
            
            // 标记文件已修改
            markFileModified();
            
            updateGameSelect();
        }

        function prevGame() {
            if (savedGames.length === 0) {
                alert('没有保存的棋局！');
                return;
            }
            
            let index = 0;
            if (currentGameId > 0) {
                index = savedGames.findIndex(g => g.id === currentGameId);
                if (index > 0) {
                    index--;
                } else {
                    index = savedGames.length - 1;
                }
            }
            
            loadGame(savedGames[index].id);
        }

        function nextGame() {
            if (savedGames.length === 0) {
                alert('没有保存的棋局！');
                return;
            }
            
            let index = 0;
            if (currentGameId > 0) {
                index = savedGames.findIndex(g => g.id === currentGameId);
                if (index < savedGames.length - 1) {
                    index++;
                } else {
                    index = 0;
                }
            }
            
            loadGame(savedGames[index].id);
        }

        function updateGameSelect() {
            gameSelect.innerHTML = '<option value="">选择棋局</option>';
            
            savedGames.forEach(game => {
                const option = document.createElement('option');
                option.value = game.id;
                option.textContent = `${game.name} (${game.timestamp}) - ${game.fragments?.length || 0}个片段`;
                option.selected = (game.id === currentGameId);
                gameSelect.appendChild(option);
            });
        }
// ========== 保存棋局数据 ==========
        function saveGameData() {
    const gameName = gameNameInput.value.trim() || "未命名棋局";
    const gameData = {
        id: currentGameId || Date.now(),
        name: gameName,
        timestamp: new Date().toLocaleString(),
        fragments: JSON.parse(JSON.stringify(savedFragments.map(f => ({
            ...f,
            // 确保underlineMarks被保存，即使是空对象
            underlineMarks: f.underlineMarks || {}
        })))),
        currentLine: JSON.parse(JSON.stringify(currentLine)),
        comments: JSON.parse(JSON.stringify(comments)),
        branchPoints: JSON.parse(JSON.stringify(branchPoints)),
        boardState: getCurrentBoardState(),
        isFlipped: isBoardFlipped
    };
    
    const existingIndex = savedGames.findIndex(g => g.id === gameData.id);
    if (existingIndex !== -1) {
        savedGames[existingIndex] = gameData;
    } else {
        savedGames.push(gameData);
        currentGameId = gameData.id;
    }
    
    // 标记文件已修改
    markFileModified();
    
    updateGameSelect();
}
        function startGame() {
            const hasRedKing = !!document.querySelector('.chess-piece.red[data-type="帅"]');
            const hasBlackKing = !!document.querySelector('.chess-piece.black[data-type="将"]');
            if(!hasRedKing || !hasBlackKing) {
                alert('残局必须包含红帅和黑将！');
                return;
            }
            gameMode = 'play';
            setupPanel.classList.remove('active');
            document.querySelector('.clock-container').style.display = 'flex';
        }

        function toggleSetupMode() {
            if(gameMode === 'setup') {
                gameMode = 'play';
                setupPanel.classList.remove('active');
                document.querySelector('.clock-container').style.display = 'flex';
                document.getElementById('toggleSetupModeBtn').textContent = '进入摆棋';
            } else {
                gameMode = 'setup';
                setupPanel.classList.add('active');
                document.querySelector('.clock-container').style.display = 'none';
                document.getElementById('toggleSetupModeBtn').textContent = '返回时钟';
            }
        }

        function newGame() {
            if(confirm('开始新棋局将清空当前棋谱，确定吗？')) {
                renderDefaultLayout();
                currentGameId = 0;
                gameSelect.value = '';
                gameNameInput.value = "未命名棋局";
                
                // 标记文件已修改
                markFileModified();
            }
        }
