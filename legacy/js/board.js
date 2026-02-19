// ========== 翻转棋盘功能 ==========
        function flipBoard() {
            isBoardFlipped = !isBoardFlipped;
            
            if (isBoardFlipped) {
                flipBoardBtn.textContent = '恢复正放';
            } else {
                flipBoardBtn.textContent = '翻转棋盘';
            }
            
            // 重新定位所有棋子
            repositionAllPieces();
        }
        
        function repositionAllPieces() {
            const pieces = document.querySelectorAll('.chess-grid .chess-piece');
            pieces.forEach(piece => {
                const row = parseInt(piece.dataset.row);
                const col = parseInt(piece.dataset.col);
                setPiecePosition(piece, row, col);
            });
        }
        
        function setPiecePosition(piece, row, col) {
            let displayRow = row;
            let displayCol = col;
            
            if (isBoardFlipped) {
                // 翻转坐标：将逻辑坐标转换为显示坐标
                displayRow = 9 - row;
                displayCol = 8 - col;
            }
            
            // 计算棋子中心位置，使用新的棋盘尺寸
            const pieceWidth = 40;
            const pieceHeight = 40;
            
            // 计算每个格子的实际宽度和高度
            const cellWidth = BOARD_WIDTH / COLS;
            const cellHeight = BOARD_HEIGHT / ROWS;
            
            // 计算棋子位置（居中放置）
            piece.style.left = `${displayCol * cellWidth + (cellWidth - pieceWidth)/2}px`;
            piece.style.top = `${displayRow * cellHeight + (cellHeight - pieceHeight)/2}px`;
            piece.dataset.row = row;
            piece.dataset.col = col;
            
            // 不再旋转棋子，只处理选中状态的缩放
            if (piece.classList.contains('selected')) {
                piece.style.transform = 'scale(1.05)';
            } else {
                piece.style.transform = '';
            }
        }

        function handleBoardClick(e) {
            if(gameOver) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 计算每个格子的实际宽度和高度
            const cellWidth = BOARD_WIDTH / COLS;
            const cellHeight = BOARD_HEIGHT / ROWS;
            
            let col = Math.floor(x / cellWidth);
            let row = Math.floor(y / cellHeight);
            
            // 关键修改：处理棋盘翻转时的坐标转换
            if (isBoardFlipped) {
                col = 8 - col;
                row = 9 - row;
            }
            
            if(col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

            if(gameMode === 'setup') {
                if(!selectedSetupPiece) return;
                removePieceAt(row, col);
                createPiece(selectedSetupPiece.type, selectedSetupPiece.color, row, col);
                return;
            }

            const targetPiece = getPieceAt(row, col);
            if(!selectedPiece) {
                if(targetPiece && targetPiece.dataset.color === currentTurn) {
                    selectedPiece = targetPiece;
                    selectedPiece.classList.add('selected');
                    setPiecePosition(selectedPiece, row, col);
                }
                return;
            }

            const fromRow = parseInt(selectedPiece.dataset.row);
            const fromCol = parseInt(selectedPiece.dataset.col);
            if(fromRow === row && fromCol === col) {
                selectedPiece.classList.remove('selected');
                setPiecePosition(selectedPiece, fromRow, fromCol);
                selectedPiece = null;
                return;
            }

            if(!validateMove(selectedPiece, fromRow, fromCol, row, col)) {
                alert('走法不合法');
                return;
            }

            executeMove(selectedPiece, fromRow, fromCol, row, col, targetPiece);
        }
// ========== 棋子操作函数 ==========
        function renderSetupPieces() {
            pieceSelector.innerHTML = '';
            pieceTypes.forEach(pInfo => {
                const div = document.createElement('div');
                div.className = `chess-piece ${pInfo.color}`;
                div.textContent = pInfo.type;
                div.dataset.type = pInfo.type;
                div.dataset.color = pInfo.color;
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.piece-selector .chess-piece').forEach(p => p.classList.remove('selected'));
                    div.classList.add('selected');
                    selectedSetupPiece = { type: pInfo.type, color: pInfo.color };
                });
                pieceSelector.appendChild(div);
            });
        }

        function renderDefaultLayout() {
            chessGrid.innerHTML = '';
            defaultLayout.forEach(p => createPiece(p.type, p.color, p.row, p.col));
            
            currentLine = [];
            savedFragments = [];
            selectedMoveIndex = -1;
            selectedFragmentIndex = -1;
            selectedFragmentMoveIndex = -1;
            currentTurn = 'red';
            gameOver = false;
            comments = {};
            branchPoints = {};
            commentInput.value = '';
            commentDisplay.textContent = '';
            currentMoveInfo.textContent = '第0着';
            gameNameInput.value = "未命名棋局";
            viewMode = 'current';
            updateViewModeButtons();
            
            isBoardFlipped = false;
            const chessContainer = document.getElementById('chessContainer');
            chessContainer.classList.remove('flipped');
            flipBoardBtn.textContent = '翻转棋盘';
            
            resetClock();
            renderRecord();
            updateStatusInfo();
            updateMarkButtons();
        }

        function createPiece(type, color, row, col) {
            const div = document.createElement('div');
            div.className = `chess-piece ${color}`;
            div.textContent = type;
            div.dataset.type = type;
            div.dataset.color = color;
            div.dataset.row = row;
            div.dataset.col = col;
            setPiecePosition(div, row, col);
            chessGrid.appendChild(div);
            return div;
        }

        function getPieceAt(row, col) {
            const pieces = document.querySelectorAll('.chess-grid .chess-piece');
            for(let p of pieces) {
                if(parseInt(p.dataset.row) === row && parseInt(p.dataset.col) === col) {
                    return p;
                }
            }
            return null;
        }

        function removePieceAt(row, col) {
            const piece = getPieceAt(row, col);
            if(piece) piece.remove();
        }
// ========== 走法验证与执行 ==========
        function validateMove(piece, fromRow, fromCol, toRow, toCol) {
            const type = piece.dataset.type;
            const color = piece.dataset.color;
            const target = getPieceAt(toRow, toCol);
            
            if(target && target.dataset.color === color) return false;

            switch(type) {
                case '帅': case '将':
                    const rMin = color === 'red' ? 7 : 0;
                    const rMax = color === 'red' ? 9 : 2;
                    const cMin = 3; const cMax = 5;
                    if(toRow < rMin || toRow > rMax || toCol < cMin || toCol > cMax) return false;
                    const rDiff = Math.abs(fromRow - toRow);
                    const cDiff = Math.abs(fromCol - toCol);
                    return (rDiff === 1 && cDiff === 0) || (rDiff === 0 && cDiff === 1);
                    
                case '车':
                    if(fromRow !== toRow && fromCol !== toCol) return false;
                    if(fromRow === toRow) {
                        for(let c = Math.min(fromCol, toCol)+1; c < Math.max(fromCol, toCol); c++) {
                            if(getPieceAt(fromRow, c)) return false;
                        }
                    } else {
                        for(let r = Math.min(fromRow, toRow)+1; r < Math.max(fromRow, toRow); r++) {
                            if(getPieceAt(r, fromCol)) return false;
                        }
                    }
                    return true;
                    
                case '马':
                    const rD = Math.abs(fromRow-toRow);
                    const cD = Math.abs(fromCol-toCol);
                    if(!((rD===2&&cD===1)||(rD===1&&cD===2))) return false;
                    const mR = Math.floor((fromRow+toRow)/2);
                    const mC = Math.floor((fromCol+toCol)/2);
                    return cD===2 ? !getPieceAt(fromRow, mC) : !getPieceAt(mR, fromCol);
                    
                case '相': case '象':
                    if(Math.abs(fromRow-toRow)!==2 || Math.abs(fromCol-toCol)!==2) return false;
                    const midR = Math.floor((fromRow+toRow)/2);
                    const midC = Math.floor((fromCol+toCol)/2);
                    if(getPieceAt(midR, midC)) return false;
                    const river = 4;
                    return color === 'red' ? toRow > river : toRow < river+1;
                    
                case '士':
                    const srMin = color === 'red' ?7:0;
                    const srMax = color === 'red' ?9:2;
                    const scMin =3; const scMax=5;
                    if(toRow<srMin||toRow>srMax||toCol<scMin||toCol>scMax) return false;
                    return Math.abs(fromRow-toRow)===1 && Math.abs(fromCol-toCol)===1;
                    
                case '炮':
                    if(fromRow!==toRow && fromCol!==toCol) return false;
                    let block = 0;
                    if(fromRow===toRow) {
                        for(let c=Math.min(fromCol,toCol)+1; c<Math.max(fromCol,toCol); c++) {
                            if(getPieceAt(fromRow,c)) block++;
                        }
                    } else {
                        for(let r=Math.min(fromRow,toRow)+1; r<Math.max(fromRow,toRow); r++) {
                            if(getPieceAt(r,fromCol)) block++;
                        }
                    }
                    return target ? block === 1 : block === 0;
                    
                case '兵': case '卒':
                    const dir = color === 'red' ? -1 : 1;
                    const riverLine = color === 'red' ?5:4;
                    const rDiffP = toRow - fromRow;
                    const cDiffP = Math.abs(fromCol - toCol);
                    if((color === 'red' && fromRow > riverLine) || (color === 'black' && fromRow < riverLine)) {
                        return rDiffP === dir && cDiffP === 0;
                    } else {
                        return (Math.abs(rDiffP) === 1 && cDiffP === 0) || (rDiffP === 0 && cDiffP === 1);
                    }
                    
                default: return false;
            }
        }

        function executeMove(piece, fromRow, fromCol, toRow, toCol, targetPiece) {
            if(targetPiece) targetPiece.remove();
            setPiecePosition(piece, toRow, toCol);

            const moveStep = {
                type: piece.dataset.type,
                color: piece.dataset.color,
                fromRow, fromCol, toRow, toCol,
                captured: targetPiece ? {type: targetPiece.dataset.type, color: targetPiece.dataset.color} : null
            };

            const moveStr = getMoveString(moveStep);
            
            const moveIndex = currentLine.length;
            currentLine.push({
                move: moveStr,
                stepInfo: moveStep,
                displayNum: moveIndex + 1
            });

            handleClockAfterMove();
            
            currentMoveInfo.textContent = `第${moveIndex+1}着`;

            if(targetPiece && (targetPiece.dataset.type === '帅' || targetPiece.dataset.type === '将')) {
                gameOver = true;
                alert(`${currentTurn === 'red' ? '红方' : '黑方'}获胜`);
                stopClock();
            }

            selectedPiece.classList.remove('selected');
            selectedPiece = null;
            
            if(!gameOver) {
                currentTurn = currentTurn === 'red' ? 'black' : 'red';
            }

            renderRecord();
            showCommentForMove(moveIndex);
            updateStatusInfo();
            
            // 标记文件已修改
            markFileModified();
        }
// ========== 时钟处理函数 ==========
        function handleClockAfterMove() {
            if(!clockRunning) return;
            
            switch(clockRule) {
                case 'suddenDeath':
                    startClock(currentTurn === 'red' ? 'black' : 'red');
                    break;
                    
                case 'increment':
                    if(currentTurn === 'red') {
                        redTime += incrementTime;
                    } else {
                        blackTime += incrementTime;
                    }
                    startClock(currentTurn === 'red' ? 'black' : 'red');
                    break;
                    
                case 'stepTime':
                    if(currentTurn === 'red') {
                        redStepTimeRemaining = redStepTime;
                    } else {
                        blackStepTimeRemaining = blackStepTime;
                    }
                    startClock(currentTurn === 'red' ? 'black' : 'red');
                    break;
            }
            
            updateClocks();
        }
// ========== 走法字符串生成 ==========
        function getMoveString(step) {
            const {type, color, fromCol, toRow, fromRow, toCol} = step;
            const fCol = color === 'red' ? COL_NAMES_RED[fromCol] : COL_NAMES_BLACK[fromCol];
            const tCol = color === 'red' ? COL_NAMES_RED[toCol] : COL_NAMES_BLACK[toCol];
            const rDiff = Math.abs(fromRow - toRow);
            const cDiff = Math.abs(fromCol - toCol);
            
            let dir, stepText;
            if(fromRow === toRow) {
                dir = '平';
                stepText = tCol;
            } else {
                dir = color === 'red' ? (toRow < fromRow ? '进' : '退') : (toRow > fromRow ? '进' : '退');
                if(['帅', '将'].includes(type)) {
                    stepText = color === 'red' ? '一' : '1';
                } else if(['马','相','象','士'].includes(type)) {
                    stepText = tCol;
                } else {
                    stepText = color === 'red' ? NUM_TO_CHINESE[rDiff] : rDiff.toString();
                }
            }
            return `${type}${fCol}${dir}${stepText}`;
        }
