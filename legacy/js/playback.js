// ========== 播放功能 ==========
        function updatePlayButtons() {
            if (isPlaying) {
                playBtn.textContent = '停止播放';
                playBtn.classList.add('playing');
                playFragmentsBtn.textContent = '停止播放';
                playFragmentsBtn.classList.add('playing');
            } else {
                playBtn.textContent = '播放当前片段';
                playBtn.classList.remove('playing');
                playFragmentsBtn.textContent = '播放所有片段';
                playFragmentsBtn.classList.remove('playing');
            }
        }
        
        function playCurrentFragment() {
            if (viewMode !== 'fragments') {
                alert('请在片段集合模式下使用此功能！');
                return;
            }
            
            if (isPlaying) {
                stopPlay();
                return;
            }
            
            if (savedFragments.length === 0) {
                alert('没有保存的片段可供播放！');
                return;
            }
            
            // 只播放当前选择的片段或第一个片段
            playFragmentList = [0]; // 只播放第一个片段
            startPlay();
        }
        
        function playAllFragments() {
            if (viewMode !== 'fragments') {
                alert('请在片段集合模式下使用此功能！');
                return;
            }
            
            if (isPlaying) {
                stopPlay();
                return;
            }
            
            if (savedFragments.length === 0) {
                alert('没有保存的片段可供播放！');
                return;
            }
            
            // 播放所有片段
            playFragmentList = savedFragments.map((_, index) => index);
            startPlay();
        }
        
        function startPlay() {
            isPlaying = true;
            updatePlayButtons();
            
            currentPlayFragmentIndex = 0;
            currentPlayStepIndex = 0;
            
            playNextStep();
        }
        
        function playNextStep() {
            if (!isPlaying) {
                return;
            }
            
            // 检查是否所有片段都播放完毕
            if (currentPlayFragmentIndex >= playFragmentList.length) {
                stopPlay();
                alert('所有片段播放完成！');
                return;
            }
            
            const fragmentIndex = playFragmentList[currentPlayFragmentIndex];
            const fragment = savedFragments[fragmentIndex];
            
            // 检查片段是否存在
            if (!fragment) {
                currentPlayFragmentIndex++;
                currentPlayStepIndex = 0;
                setTimeout(playNextStep, 100);
                return;
            }
            
// 检查片段是否有步法
            if (!fragment.moves || fragment.moves.length === 0) {
                // 该片段没有步法，跳到下一个片段
                currentPlayFragmentIndex++;
                currentPlayStepIndex = 0;
                setTimeout(playNextStep, 100);
                return;
            }
            
            // 检查是否已播放完当前片段
            if (currentPlayStepIndex >= fragment.moves.length) {
                // 该片段已播放完，跳到下一个片段
                currentPlayFragmentIndex++;
                currentPlayStepIndex = 0;
                
                // 片段间暂停500毫秒
                setTimeout(playNextStep, 500);
                return;
            }
            
            // 确定播放速度
            let playSpeed = 2000; // 默认正常速度2秒
            
            // 片段1：始终正常速度2秒/步
            // 片段2、3、4：快速播放(0.2秒/步)到分支点标记处，然后正常播放(2秒/步)
            if (fragmentIndex === 0) {
                // 片段1：始终正常速度
                playSpeed = 2000;
            } else {
                // 片段2、3、4：检查是否有分支点标记
                const hasBranchPoint = fragment.branchPoints && Object.keys(fragment.branchPoints).length > 0;
                
                if (hasBranchPoint) {
                    // 找到第一个分支点标记的步数
                    let firstBranchStep = null;
                    // 确保按正确的顺序检查分支点
                    for (let i = 0; i < fragment.moves.length; i++) {
                        if (fragment.branchPoints[i]) {
                            firstBranchStep = i;
                            break;
                        }
                    }
                    
                    // 如果当前步在分支点之前，快速播放；否则正常播放
                    if (firstBranchStep !== null && currentPlayStepIndex <= firstBranchStep) {
                        playSpeed = 200; // 快速播放0.2秒/步
                    } else {
                        playSpeed = 2000; // 正常播放2秒/步
                    }
                } else {
                    // 没有分支点标记，全部正常播放
                    playSpeed = 2000;
                }
            }
            
            // 播放当前步
            playStep(fragmentIndex, currentPlayStepIndex, playSpeed);
            
            // 准备下一步
            currentPlayStepIndex++;
            
            // 设置定时器播放下一步
            playTimer = setTimeout(playNextStep, playSpeed);
        }
        
        function playStep(fragmentIndex, stepIndex, speed) {
            const fragment = savedFragments[fragmentIndex];
            if (!fragment || !fragment.moves[stepIndex]) return;
            
            // 更新棋盘到该步状态
            replayFragmentStep(fragmentIndex, stepIndex);
            
            // 高亮显示当前步 - 修复：先清除所有高亮，再添加当前步高亮
            highlightPlayStep(fragmentIndex, stepIndex, speed);
            
            // 更新状态信息
            const speedText = speed === 200 ? '快速' : '正常';
            gameStatusInfo.textContent = `播放中：片段${fragmentIndex + 1}，第${stepIndex + 1}着 (${speedText}速度)`;
            
            // 语音朗读：只在正常速度时朗读
            if (speed === 2000 && voiceEnabled && voiceToggle.checked) {
                speakMove(fragment.moves[stepIndex].move);
            }
        }
        
        function replayFragmentStep(fragmentIndex, stepIndex) {
            const fragment = savedFragments[fragmentIndex];
            if (!fragment) return;
            
            // 重置棋盘到片段初始状态
            chessGrid.innerHTML = '';
            fragment.boardState.forEach(p => createPiece(p.type, p.color, p.row, p.col));
            
            // 重放到指定步数
            for(let i = 0; i <= stepIndex; i++) {
                const move = fragment.moves[i];
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
            
            currentMoveInfo.textContent = `片段${fragmentIndex + 1}，第${stepIndex + 1}着`;
        }
        
        function highlightPlayStep(fragmentIndex, stepIndex, speed) {
            // 清除所有高亮
            document.querySelectorAll('.record-line').forEach(line => {
                line.classList.remove('playing');
                // 清除旧的指示器
                const oldIndicator = line.querySelector('.play-speed-indicator');
                if (oldIndicator) {
                    oldIndicator.remove();
                }
            });
            
            // 找到对应的棋谱行并高亮
            const recordLines = document.querySelectorAll('.record-line');
            let lineIndex = 0;
            
            // 计算目标行在所有行中的索引
            for(let i = 0; i < savedFragments.length; i++) {
                if (i < fragmentIndex) {
                    // 跳过之前的片段
                    lineIndex += savedFragments[i].moves.length;
                    lineIndex++; // 加上片段标题行
                } else if (i === fragmentIndex) {
                    // 找到目标片段
                    lineIndex++; // 跳过片段标题行
                    break;
                }
            }
            
            // ========== 修复：标注位置问题 ==========
            // 注意：这里要确保行索引正确
            // 如果stepIndex为0，应该就是目标片段的第一个步法行
            lineIndex += stepIndex;
            
            if (recordLines[lineIndex]) {
                recordLines[lineIndex].classList.add('playing');
                
                // 添加速度指示器 - 修复：确保在正确的行添加
                const speedSpan = document.createElement('span');
                speedSpan.className = `play-speed-indicator ${speed === 200 ? 'fast' : 'normal'}`;
                speedSpan.textContent = speed === 200 ? '快速' : '正常';
                
                recordLines[lineIndex].appendChild(speedSpan);
                
                // 滚动到可见区域
                recordLines[lineIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
        
        // ========== 语音朗读功能 ==========
        function speakMove(moveText) {
            // 使用Web Speech API进行语音合成
            if ('speechSynthesis' in window) {
                // 停止当前正在播放的语音
                speechSynthesis.cancel();
                
                // 创建语音合成实例
                const utterance = new SpeechSynthesisUtterance();
                utterance.text = moveText; // 只读棋谱，如"炮二平五"
                utterance.lang = 'zh-CN';
                utterance.rate = 1.0; // 语速
                utterance.pitch = 1.0; // 音调
                utterance.volume = 1.0; // 音量
                
                // 播放语音
                speechSynthesis.speak(utterance);
            }
        }
        
        function stopPlay() {
            isPlaying = false;
            if (playTimer) {
                clearTimeout(playTimer);
                playTimer = null;
            }
            
            updatePlayButtons();
            
            // 清除所有高亮
            document.querySelectorAll('.record-line').forEach(line => {
                line.classList.remove('playing');
            });
            
            // 清除速度指示器
            document.querySelectorAll('.play-speed-indicator').forEach(indicator => {
                indicator.remove();
            });
            
            // 停止语音
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
            }
            
            // 恢复状态信息
            updateStatusInfo();
        }
