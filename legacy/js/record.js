// ========== 棋谱镜像功能 ==========
        function mirrorRecord() {
            // 检查是否有已保存的棋局
            if (savedGames.length === 0) {
                alert('没有已保存的棋局，无法进行镜像！');
                return;
            }
            
            // 检查当前加载的棋局是否只有一个片段
            if (savedFragments.length !== 1) {
                alert('当前棋局不包含片段或包含多个片段，请选择只包含一个片段的棋局！');
                return;
            }
            
            // 确认操作
            if (!confirm('确定要镜像当前棋局吗？这将创建一个新的镜像棋局。')) {
                return;
            }
            
            try {
                // 获取当前棋局的名称
                const originalName = gameNameInput.value.trim() || "未命名棋局";
                
                // 创建镜像棋局
                const mirroredGame = createMirroredGame(originalName);
                
                // 添加到保存的棋局列表
                savedGames.push(mirroredGame);
                
                // 标记文件已修改
                markFileModified();
                
                // 更新游戏选择下拉框
                updateGameSelect();
                
                // 加载镜像棋局
                loadGame(mirroredGame.id);
                
                alert(`镜像棋局创建成功！新棋局名称：${mirroredGame.name}`);
            } catch (error) {
                console.error('镜像棋局失败:', error);
                alert('镜像棋局失败！');
            }
        }

        function createMirroredGame(originalName) {
            // 1. 镜像当前线路
            const mirroredCurrentLine = mirrorMoveList(currentLine);
            
            // 2. 镜像保存的片段（只有一个）
            const mirroredFragments = savedFragments.map(fragment => {
                return {
                    ...fragment,
                    moves: mirrorMoveList(fragment.moves),
                    title: fragment.title.replace('棋局', '镜像棋局')
                };
            });
            
            // 3. 创建镜像棋盘状态（将棋盘左右翻转）
            const mirroredBoardState = getCurrentBoardState().map(piece => {
                return {
                    ...piece,
                    col: 8 - piece.col // 列坐标镜像（0-8）
                };
            });
            
            // 4. 创建新棋局数据
            const mirroredGame = {
                id: Date.now(),
                name: `镜像${originalName}`,
                timestamp: new Date().toLocaleString(),
                fragments: mirroredFragments,
                currentLine: mirroredCurrentLine,
                comments: JSON.parse(JSON.stringify(comments)),
                branchPoints: JSON.parse(JSON.stringify(branchPoints)),
                boardState: mirroredBoardState,
                isFlipped: isBoardFlipped
            };
            
            return mirroredGame;
        }

        function mirrorMoveList(moveList) {
            return moveList.map(move => {
                if (!move.stepInfo) return move;
                
                const stepInfo = move.stepInfo;
                const color = stepInfo.color;
                
                // 镜像列坐标（左右翻转）
                const mirroredFromCol = 8 - stepInfo.fromCol;
                const mirroredToCol = 8 - stepInfo.toCol;
                
                // 创建镜像后的步法信息
                const mirroredStepInfo = {
                    ...stepInfo,
                    fromCol: mirroredFromCol,
                    toCol: mirroredToCol
                };
                
                // 重新生成镜像后的着法字符串
                const mirroredMoveStr = getMirroredMoveString(mirroredStepInfo, color);
                
                return {
                    ...move,
                    move: mirroredMoveStr,
                    stepInfo: mirroredStepInfo
                };
            });
        }

        function getMirroredMoveString(step, color) {
            // 列名映射关系（镜像关系）
            const RED_COL_MIRROR = {
                '九': '一', '八': '二', '七': '三', '六': '四', 
                '五': '五', '四': '六', '三': '七', '二': '八', '一': '九'
            };
            
            const BLACK_COL_MIRROR = {
                '1': '9', '2': '8', '3': '7', '4': '6', 
                '5': '5', '6': '4', '7': '3', '8': '2', '9': '1'
            };
            
            // 获取原始列名
            const fCol = color === 'red' ? COL_NAMES_RED[step.fromCol] : COL_NAMES_BLACK[step.fromCol];
            const tCol = color === 'red' ? COL_NAMES_RED[step.toCol] : COL_NAMES_BLACK[step.toCol];
            
            // 获取镜像列名
            const mirroredFCol = color === 'red' ? RED_COL_MIRROR[fCol] || fCol : BLACK_COL_MIRROR[fCol] || fCol;
            const mirroredTCol = color === 'red' ? RED_COL_MIRROR[tCol] || tCol : BLACK_COL_MIRROR[tCol] || tCol;
            
            const rDiff = Math.abs(step.fromRow - step.toRow);
            const cDiff = Math.abs(step.fromCol - step.toCol);
            
            let dir, stepText;
            
            if (step.fromRow === step.toRow) {
                // 平
                dir = '平';
                stepText = mirroredTCol;
            } else {
                // 进或退
                dir = color === 'red' ? (step.toRow < step.fromRow ? '进' : '退') : (step.toRow > step.fromRow ? '进' : '退');
                
                if (['帅', '将'].includes(step.type)) {
                    // 将帅移动一步
                    stepText = color === 'red' ? '一' : '1';
                } else if (['马', '相', '象', '士'].includes(step.type)) {
                    // 马、相、象、士移动用目标列
                    stepText = mirroredTCol;
                } else {
                    // 车、炮、兵、卒前进/后退用步数
                    stepText = color === 'red' ? NUM_TO_CHINESE[rDiff] : rDiff.toString();
                }
            }
            
            return `${step.type}${mirroredFCol}${dir}${stepText}`;
        }
// ========== 从此变着功能 ==========
        function branchFromHere() {
            if (selectedMoveIndex < 0) {
                alert('请先在棋谱记录中选择一个着法！');
                return;
            }
            
            const selectedStepNum = selectedMoveIndex + 1;
            const currentStepCount = currentLine.length;
            
            // 检查是否是最后一步
            const isLastMove = selectedStepNum === currentStepCount;
            
            // 保存当前线路为新片段（完整线路，序号1-最后）
            const fragmentTitle = `棋局${savedFragments.length + 1}（1-${currentStepCount}着）`;
            
            // 保存完整线路，包括分支点标记
            const fragmentMoves = JSON.parse(JSON.stringify(currentLine));
            const fragmentComments = JSON.parse(JSON.stringify(comments));
            const fragmentBranchPoints = JSON.parse(JSON.stringify(branchPoints));
            
            // 为片段中的每一步重新编号为1开始
            fragmentMoves.forEach((move, index) => {
                move.displayNum = index + 1;
            });
            
            const fragment = {
                startStep: 1,
                moves: fragmentMoves,
                comments: fragmentComments,
                branchPoints: fragmentBranchPoints,
                title: fragmentTitle,
                boardState: getBoardStateAtStep(0),
                totalSteps: currentStepCount
            };
            
            savedFragments.push(fragment);
            
            // ========== 修复：如果是最后一步，直接结束棋局 ==========
            if (isLastMove) {
                gameOver = true;
                alert(`已保存完整棋局"${fragmentTitle}"！棋局已结束，可以开始新局。`);
                
                // 保存完整棋局
                saveGameData();
                
                // 标记文件已修改
                markFileModified();
                
                // 重绘棋谱
                renderRecord();
                updateStatusInfo();
                updateMarkButtons();
                
                return;
            }
            
            // 创建新线路：从1到当前选择着法
            currentLine = JSON.parse(JSON.stringify(currentLine.slice(0, selectedStepNum)));
            selectedMoveIndex = -1;
            
            // 为新线路重新编号
            currentLine.forEach((move, index) => {
                move.displayNum = index + 1;
            });
            
            // 清空注释
            comments = {};
            
            // ========== 关键修改：正确设置新线路的回合 ==========
            if (selectedStepNum > 0) {
                // 新线路的最后一步
                const lastMove = currentLine[currentLine.length - 1];
                if (lastMove && lastMove.stepInfo) {
                    // 分支后，轮到上一步的对方走棋
                    const lastColor = lastMove.stepInfo.color;
                    currentTurn = lastColor === 'red' ? 'black' : 'red';
                } else {
                    // 默认情况
                    currentTurn = currentLine.length % 2 === 0 ? 'red' : 'black';
                }
            } else {
                // 如果从第0步开始分支，红方先走
                currentTurn = 'red';
            }
            // ========== 修改结束 ==========
            
            // 自动在线路2的当前选择着法处添加分支点标记
            branchPoints = {};
            if (selectedStepNum > 0) {
                branchPoints[selectedStepNum - 1] = true;
            }
            
            // 重放棋盘到新线路的末尾
            replayBoard(currentLine.length - 1);
            
            alert(`已保存片段"${fragmentTitle}"，当前线路变为1-${selectedStepNum}着。已在线路2的第${selectedStepNum}着自动添加分支点标记。`);
            
            // 保存完整棋局
            saveGameData();
            
            // 标记文件已修改
            markFileModified();
            
            // 重绘棋谱
            renderRecord();
            updateStatusInfo();
            updateMarkButtons();
        }
        
        function getBoardStateAtStep(stepIndex) {
            // 先保存当前棋盘状态
            const currentState = getCurrentBoardState();
            
            // 回退到指定步数
            chessGrid.innerHTML = '';
            defaultLayout.forEach(p => createPiece(p.type, p.color, p.row, p.col));
            
            for(let i = 0; i <= stepIndex; i++) {
                const move = currentLine[i];
                if(move && move.stepInfo) {
                    const step = move.stepInfo;
                    const piece = getPieceAt(step.fromRow, step.fromCol);
                    if(piece) {
                        if(step.captured) {
                            removePieceAt(step.toRow, step.toCol);
                        }
                        setPiecePosition(piece, step.toRow, step.toCol);
                    }
                }
            }
            
            // 获取指定步数的棋盘状态
            const stepState = getCurrentBoardState();
            
            // 恢复原来的棋盘状态
            chessGrid.innerHTML = '';
            currentState.forEach(p => createPiece(p.type, p.color, p.row, p.col));
            
            return stepState;
        }
// ========== 标记分支点功能 ==========
        function markBranchPoint() {
            if (viewMode !== 'current') {
                alert('请在当前线路模式下标记分支点！');
                return;
            }
            
            if(selectedMoveIndex < 0) {
                alert('请先选择一个着法！');
                return;
            }
            
            // 检查是否已经有分支点标记
            const existingBranchPoints = Object.keys(branchPoints);
            
            // 如果已经有分支点标记，询问用户是否替换
            if (existingBranchPoints.length > 0) {
                if (!confirm('当前线路已有一个分支点标记。是否替换为新的分支点？')) {
                    return;
                }
                // 清除所有现有的分支点标记
                for (let key in branchPoints) {
                    delete branchPoints[key];
                }
            }
            
            // 标记新的分支点（只是标记，没有功能）
            branchPoints[selectedMoveIndex] = true;
            alert(`已将第${selectedMoveIndex+1}着标记为分支点（仅标记）`);
            
            // 标记文件已修改
            markFileModified();
            
            // 更新按钮文本
            updateMarkButtons();
            
            // 重新渲染棋谱
            renderRecord();
        }
        
        function deleteBranchPoint() {
            const existingBranchPoints = Object.keys(branchPoints);
            if (existingBranchPoints.length === 0) {
                alert('当前没有分支点标记！');
                return;
            }
            
            // 删除所有分支点标记
            for (let key in branchPoints) {
                delete branchPoints[key];
            }
            
            alert('已删除所有分支点标记');
            
            // 标记文件已修改
            markFileModified();
            
            // 更新按钮文本
            updateMarkButtons();
            
            // 重新渲染棋谱
            renderRecord();
        }
        
        function updateMarkButtons() {
            if (viewMode === 'fragments' && 
                typeof selectedFragmentIndex !== 'undefined' && 
                selectedFragmentIndex >= 0 &&
                savedFragments[selectedFragmentIndex] && 
                savedFragments[selectedFragmentIndex].editable) {
                
                const fragment = savedFragments[selectedFragmentIndex];
                const isUnderlined = fragment.underlineMarks && 
                                    fragment.underlineMarks[selectedFragmentMoveIndex];
                
                // 显示下划线标记按钮
                markUnderlineBtn.textContent = isUnderlined ? '移除下划线' : '添加下划线';
                markUnderlineBtn.style.display = 'block';
                markBranchBtn.style.display = 'none';
                deleteBranchBtn.style.display = 'none';
                
            } else if (viewMode === 'current') {
                // 当前线路模式
                const hasBranchPoint = Object.keys(branchPoints).length > 0;
                if (hasBranchPoint) {
                    markBranchBtn.textContent = '修改分支点标记';
                    markBranchBtn.style.background = '#ff5722';
                } else {
                    markBranchBtn.textContent = '标记为分支点';
                    markBranchBtn.style.background = '#ff9800';
                }
                markBranchBtn.style.display = 'block';
                deleteBranchBtn.style.display = 'block';
                markUnderlineBtn.style.display = 'none';
            } else {
                // 片段集合查看模式
                markBranchBtn.style.display = 'none';
                deleteBranchBtn.style.display = 'none';
                markUnderlineBtn.style.display = 'none';
            }
        }
// ========== 核心：棋谱渲染 ==========
        function renderRecord() {
            recordArea.innerHTML = '';
            
            if (viewMode === 'current') {
                renderCurrentLine(currentLine);
            } else {
                renderFragmentsView();
            }
            
            if(currentLine.length === 0 && viewMode === 'current') {
                recordArea.textContent = '请开始对弈';
            }
            
            if (viewMode === 'current') {
                currentMoveInfo.textContent = `第${currentLine.length}着`;
            } else {
                currentMoveInfo.textContent = `片段集合 (${savedFragments.length}个片段)`;
            }
        }
        
        function renderCurrentLine(moves) {
            for(let i = 0; i < moves.length; i++) {
                const move = moves[i];
                const moveDiv = document.createElement('div');
                moveDiv.className = 'record-line';
                
                let moveText = '';
                
                // 添加分支点标记（只是标记，没有功能）
                if (branchPoints[i]) {
                    moveText += '<span class="branch-point-marker active" title="分支点标记">★</span>';
                }
                
                moveText += `${move.displayNum}. ${move.move}`;
                
                // 添加注释
                if (comments[i]) {
                    moveText += ` <span class="complete-comment">${comments[i]}</span>`;
                }
                
                moveDiv.innerHTML = moveText;
                
                moveDiv.onclick = () => {
                    selectedMoveIndex = i;
                    document.querySelectorAll('.record-line').forEach(l => {
                        l.classList.remove('selected');
                        l.classList.remove('active');
                        l.classList.remove('playing');
                    });
                    moveDiv.classList.add('selected');
                    
                    replayBoard(i);
                    showCommentForMove(i);
                    updateMarkButtons();
                };
                
                if(i === moves.length - 1 && !gameOver) {
                    moveDiv.classList.add('active');
                }
                
                recordArea.appendChild(moveDiv);
            }
        }
        
        function renderFragmentsView() {
            if (savedFragments.length === 0) {
                recordArea.textContent = '暂无保存的片段';
                return;
            }
            
            for(let i = 0; i < savedFragments.length; i++) {
                const fragment = savedFragments[i];
                
                // 显示片段标题
                const titleDiv = document.createElement('div');
                titleDiv.className = 'fragment-title';
                
                // 在标题中添加编辑按钮
                titleDiv.innerHTML = `
                    ${fragment.title || `片段${i + 1}`}
                    <button class="btn small-btn fragment-edit-btn" onclick="toggleFragmentEdit(${i})" 
                            style="float:right; padding:2px 4px; font-size:10px; margin-left:5px;">
                        ${fragment.editable ? '退出编辑' : '编辑'}
                    </button>
                `;
                
                if (fragment.editable) {
                    titleDiv.classList.add('fragment-editing');
                }
                
                recordArea.appendChild(titleDiv);
                
                // 显示片段中的每一步棋
                fragment.moves.forEach((move, moveIndex) => {
                    const moveDiv = document.createElement('div');
                    moveDiv.className = 'record-line';
                    
                    let moveText = '';
                    
                    // 分支点标记
                    if (fragment.branchPoints && fragment.branchPoints[moveIndex]) {
                        moveText += '<span class="fragment-branch-point" title="分支点标记">★</span>';
                    }
                    
                    // 下划线标记
                    const isUnderlined = fragment.underlineMarks && fragment.underlineMarks[moveIndex];
                    if (isUnderlined) {
                        moveText += '<span class="underlined-move" title="下划线标记">';
                    }
                    
                    moveText += `${move.displayNum}. ${move.move}`;
                    
                    if (isUnderlined) {
                        moveText += '</span>';
                    }
                    
                    // 添加注释
                    if (fragment.comments && fragment.comments[moveIndex]) {
                        moveText += ` <span class="complete-comment">${fragment.comments[moveIndex]}</span>`;
                    }
                    
                    moveDiv.innerHTML = moveText;
                    moveDiv.dataset.fragmentIndex = i;
                    moveDiv.dataset.moveIndex = moveIndex;
                    
                    // 点击事件处理
                    moveDiv.onclick = function() {
                        if (fragment.editable) {
                            // 编辑模式：选择着法进行标记
                            document.querySelectorAll('.record-line').forEach(l => l.classList.remove('editable-selected'));
                            moveDiv.classList.add('editable-selected');
                            
                            // 更新当前选择的片段和着法
                            selectedFragmentIndex = i;
                            selectedFragmentMoveIndex = moveIndex;
                            
                            // 启用标记按钮
                            updateMarkButtons();
                        } else {
                            // 查看模式：查看该着法的棋盘状态
                            replayFragmentStep(i, moveIndex);
                        }
                    };
                    
                    recordArea.appendChild(moveDiv);
                });
            }
        }

        function replayBoard(stepIndex) {
            chessGrid.innerHTML = '';
            defaultLayout.forEach(p => createPiece(p.type, p.color, p.row, p.col));
            
            for(let i = 0; i <= stepIndex; i++) {
                const move = currentLine[i];
                if(move && move.stepInfo) {
                    const step = move.stepInfo;
                    const piece = getPieceAt(step.fromRow, step.fromCol);
                    if(piece) {
                        if(step.captured) {
                            removePieceAt(step.toRow, step.toCol);
                        }
                        setPiecePosition(piece, step.toRow, step.toCol);
                    }
                }
            }
            
            currentMoveInfo.textContent = `第${stepIndex+1}着`;
            
            if(clockRunning) {
                stopClock();
            }
        }
// ========== 片段编辑功能 ==========
        function toggleFragmentEdit(fragmentIndex) {
            if (!savedFragments[fragmentIndex]) return;
            
            // 初始化编辑状态
            if (typeof savedFragments[fragmentIndex].editable === 'undefined') {
                savedFragments[fragmentIndex].editable = false;
            }
            
            savedFragments[fragmentIndex].editable = !savedFragments[fragmentIndex].editable;
            
            // 确保其他片段退出编辑模式
            savedFragments.forEach((fragment, idx) => {
                if (idx !== fragmentIndex && fragment.editable) {
                    fragment.editable = false;
                }
            });
            
            // 重置选择状态
            if (!savedFragments[fragmentIndex].editable) {
                selectedFragmentIndex = -1;
                selectedFragmentMoveIndex = -1;
            }
            
            renderRecord();
            updateMarkButtons();
            
            // 标记文件已修改
            markFileModified();
        }

        function markUnderline() {
    if (viewMode !== 'fragments') {
        alert('请在片段集合模式下使用此功能！');
        return;
    }
    
    if (selectedFragmentIndex < 0 || selectedFragmentMoveIndex < 0) {
        alert('请先选择一个着法！');
        return;
    }
    
    const fragment = savedFragments[selectedFragmentIndex];
    if (!fragment || !fragment.editable) {
        alert('请先进入编辑模式！');
        return;
    }
    
    // 初始化underlineMarks对象
    if (!fragment.underlineMarks) {
        fragment.underlineMarks = {};
    }
    
    // 切换下划线标记
    if (fragment.underlineMarks[selectedFragmentMoveIndex]) {
        delete fragment.underlineMarks[selectedFragmentMoveIndex];
        alert(`已移除第${selectedFragmentMoveIndex + 1}着的下划线标记`);
    } else {
        fragment.underlineMarks[selectedFragmentMoveIndex] = true;
        alert(`已为第${selectedFragmentMoveIndex + 1}着添加下划线标记`);
    }
    
    // 立即保存当前棋局数据到savedGames
    saveGameData();
    
    // 标记文件已修改
    markFileModified();
    
    // 重新渲染棋谱
    renderRecord();
    updateMarkButtons();
}
        function renderBoardToStep(stepIndex) {
            // 清空棋盘
            chessGrid.innerHTML = '';
            
            // 使用默认布局初始化
            defaultLayout.forEach(p => createPiece(p.type, p.color, p.row, p.col));
            
            // 如果stepIndex为0，就是初始布局
            if (stepIndex > 0) {
                // 重放到指定步数
                for(let i = 0; i < stepIndex; i++) {
                    const move = currentLine[i];
                    if(move && move.stepInfo) {
                        const step = move.stepInfo;
                        const piece = getPieceAt(step.fromRow, step.fromCol);
                        if(piece) {
                            if(step.captured) {
                                removePieceAt(step.toRow, step.toCol);
                            }
                            setPiecePosition(piece, step.toRow, step.toCol);
                        }
                    }
                }
            }
        }
// ========== 更新状态信息 ==========
        function updateStatusInfo() {
            const fragmentCount = savedFragments.length;
            const currentSteps = currentLine.length;
            const modeText = viewMode === 'current' ? '当前线路' : '片段集合';
            
            gameStatusInfo.textContent = `显示模式：${modeText} | 当前线路：${currentSteps}步 | 已保存片段：${fragmentCount}个`;
        }
        
        function updateViewModeButtons() {
            if (viewMode === 'current') {
                viewCurrentBtn.classList.add('active');
                viewFragmentsBtn.classList.remove('active');
                viewCurrentBtn.style.background = '#2196f3';
                viewCurrentBtn.style.color = 'white';
                viewFragmentsBtn.style.background = '#f5f5f5';
                viewFragmentsBtn.style.color = '#333';
            } else {
                viewCurrentBtn.classList.remove('active');
                viewFragmentsBtn.classList.add('active');
                viewCurrentBtn.style.background = '#f5f5f5';
                viewCurrentBtn.style.color = '#333';
                viewFragmentsBtn.style.background = '#2196f3';
                viewFragmentsBtn.style.color = 'white';
            }
        }
        
        function switchViewMode(mode) {
            viewMode = mode;
            updateViewModeButtons();
            renderRecord();
            updateStatusInfo();
            
            if (viewMode === 'current') {
                if (currentLine.length > 0) {
                    replayBoard(currentLine.length - 1);
                } else {
                    renderDefaultLayout();
                }
            }
        }
// ========== 注释功能 ==========
        function addComment() {
            if (viewMode !== 'current') {
                alert('请在当前线路模式下添加注释！');
                return;
            }
            
            if(selectedMoveIndex < 0) {
                alert('请先选择一个着法！');
                return;
            }
            
            const comment = commentInput.value.trim();
            if(!comment) {
                alert('请输入注释内容！');
                return;
            }
            
            comments[selectedMoveIndex] = comment;
            commentInput.value = '';
            renderRecord();
            showCommentForMove(selectedMoveIndex);
            
            // 标记文件已修改
            markFileModified();
            
            alert('注释已添加！');
        }
        
        function saveComment() {
            if (viewMode !== 'current') {
                alert('请在当前线路模式下保存注释！');
                return;
            }
            
            if(selectedMoveIndex < 0) {
                alert('请先选择一个着法！');
                return;
            }
            
            const comment = commentInput.value.trim();
            if(comment) {
                comments[selectedMoveIndex] = comment;
                renderRecord();
                showCommentForMove(selectedMoveIndex);
                
                // 标记文件已修改
                markFileModified();
                
                alert('注释已保存！');
            } else {
                delete comments[selectedMoveIndex];
                renderRecord();
                commentDisplay.textContent = '';
                
                // 标记文件已修改
                markFileModified();
                
                alert('注释已清除！');
            }
        }
        
        function showCommentForMove(moveIndex) {
            if(comments[moveIndex]) {
                commentDisplay.textContent = `第${moveIndex+1}着注释: ${comments[moveIndex]}`;
                commentInput.value = comments[moveIndex];
            } else {
                commentDisplay.textContent = '暂无注释';
                commentInput.value = '';
            }
        }
        function undoMove() {
            if (viewMode !== 'current') {
                alert('请在当前线路模式下使用悔棋功能！');
                return;
            }
            
            if(currentLine.length === 0) return;
            
            const lastMove = currentLine[currentLine.length - 1];
            currentLine.pop();
            
            const lastIndex = currentLine.length;
            delete comments[lastIndex];
            delete branchPoints[lastIndex];
            
            selectedMoveIndex = -1;
            
            // ========== 修复：改进回合判断逻辑 ==========
            if (currentLine.length > 0) {
                // 有走法时，根据最后一步的颜色确定回合
                const lastRemainingMove = currentLine[currentLine.length - 1];
                if (lastRemainingMove && lastRemainingMove.stepInfo) {
                    const lastColor = lastRemainingMove.stepInfo.color;
                    currentTurn = lastColor === 'red' ? 'black' : 'red';
                } else {
                    // 如果没有步法信息，根据剩余步数确定
                    currentTurn = currentLine.length % 2 === 0 ? 'red' : 'black';
                }
                
                const lastIndex = currentLine.length - 1;
                replayBoard(lastIndex);
                showCommentForMove(lastIndex);
            } else {
                // 当退回到第0步时，需要特殊处理回合
                
                // 情况1：如果是线路1，总是红方先走
                if (savedFragments.length === 0) {
                    currentTurn = 'red';
                } 
                // 情况2：如果是分支后的线路（线路2、3、4等），需要根据分支点的回合确定
                else {
                    // 查找当前线路的来源（哪个片段的分支）
                    const fragmentIndex = savedFragments.findIndex(fragment => 
                        fragment.moves && fragment.moves.length > 0 && 
                        fragment.moves[fragment.moves.length - 1].move === lastMove.move
                    );
                    
                    if (fragmentIndex !== -1) {
                        // 从片段中获取分支点的回合
                        const sourceFragment = savedFragments[fragmentIndex];
                        if (sourceFragment.moves && sourceFragment.moves.length > 0) {
                            const lastFragmentMove = sourceFragment.moves[sourceFragment.moves.length - 1];
                            if (lastFragmentMove && lastFragmentMove.stepInfo) {
                                const lastColor = lastFragmentMove.stepInfo.color;
                                currentTurn = lastColor === 'red' ? 'black' : 'red';
                            } else {
                                currentTurn = 'red'; // 默认
                            }
                        } else {
                            currentTurn = 'red'; // 默认
                        }
                    } else {
                        // 无法确定来源，使用默认逻辑
                        currentTurn = 'red';
                    }
                }
                
                // 恢复到第0步的棋盘状态
                renderBoardToStep(0);
                currentMoveInfo.textContent = '第0着';
                commentDisplay.textContent = '';
                commentInput.value = '';
            }
            // ========== 修复结束 ==========
            
            renderRecord();
            updateStatusInfo();
            updateMarkButtons();
            
            // 标记文件已修改
            markFileModified();
        }

        function copyRecord() {
            let text = '';
            
            if (viewMode === 'current') {
                currentLine.forEach((move, index) => {
                    let moveText = `${move.displayNum}. ${move.move}`;
                    if(comments[index]) {
                        moveText += ` (${comments[index]})`;
                    }
                    text += moveText + '\n';
                });
            } else {
                savedFragments.forEach((fragment, fragmentIndex) => {
                    text += `片段${fragmentIndex + 1}: ${fragment.title}\n`;
                    fragment.moves.forEach((move, moveIndex) => {
                        let moveText = `  ${move.displayNum}. ${move.move}`;
                        if(fragment.comments && fragment.comments[moveIndex]) {
                            moveText += ` (${fragment.comments[moveIndex]})`;
                        }
                        if(fragment.underlineMarks && fragment.underlineMarks[moveIndex]) {
                            moveText += ' [下划线]';
                        }
                        text += moveText + '\n';
                    });
                    text += '\n';
                });
            }
            
            if(text === '') text = '棋谱为空';
            
            navigator.clipboard.writeText(text).then(() => {
                alert(`已复制${viewMode === 'current' ? '当前线路' : '片段集合'}棋谱！`);
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert(`已复制${viewMode === 'current' ? '当前线路' : '片段集合'}棋谱！`);
            });
        }
