// ========== 时钟功能 ==========
        function selectRule(rule) {
            clockRule = rule;
            
            document.querySelectorAll('.rule-option').forEach(el => {
                el.classList.remove('selected');
                el.querySelector('input').checked = false;
            });
            document.querySelector(`.rule-option[data-rule="${rule}"]`).classList.add('selected');
            document.querySelector(`.rule-option[data-rule="${rule}"] input`).checked = true;
            
            updateClockSettings();
            resetClock();
        }
        
        function updateClockSettings() {
            clockSettings.innerHTML = '';
            
            switch(clockRule) {
                case 'suddenDeath':
                    clockSettings.innerHTML = `
                        <div class="clock-setter-group">
                            <label>红方时间(分):</label>
                            <input type="number" id="redTimeSuddenDeath" value="20" min="1" max="180">
                        </div>
                        <div class="clock-setter-group">
                            <label>黑方时间(分):</label>
                            <input type="number" id="blackTimeSuddenDeath" value="20" min="1" max="180">
                        </div>
                    `;
                    redStepTimeDisplay.style.display = 'none';
                    blackStepTimeDisplay.style.display = 'none';
                    break;
                    
                case 'increment':
                    clockSettings.innerHTML = `
                        <div class="clock-setter-group">
                            <label>红方时间(分):</label>
                            <input type="number" id="redTimeIncrement" value="20" min="1" max="180">
                        </div>
                        <div class="clock-setter-group">
                            <label>黑方时间(分):</label>
                            <input type="number" id="blackTimeIncrement" value="20" min="1" max="180">
                        </div>
                        <div class="clock-setter-group">
                            <label>每步加时(秒):</label>
                            <input type="number" id="incrementTime" value="5" min="0" max="60">
                        </div>
                    `;
                    redStepTimeDisplay.style.display = 'none';
                    blackStepTimeDisplay.style.display = 'none';
                    break;
                    
                case 'stepTime':
                    clockSettings.innerHTML = `
                        <div class="clock-setter-group">
                            <label>红方时间(分):</label>
                            <input type="number" id="redTimeStep" value="20" min="1" max="180">
                        </div>
                        <div class="clock-setter-group">
                            <label>黑方时间(分):</label>
                            <input type="number" id="blackTimeStep" value="20" min="1" max="180">
                        </div>
                        <div class="clock-setter-group">
                            <label>红方步时(秒):</label>
                            <input type="number" id="redStepTimeInput" value="60" min="5" max="300">
                        </div>
                        <div class="clock-setter-group">
                            <label>黑方步时(秒):</label>
                            <input type="number" id="blackStepTimeInput" value="60" min="5" max="300">
                        </div>
                    `;
                    redStepTimeDisplay.style.display = 'block';
                    blackStepTimeDisplay.style.display = 'block';
                    break;
            }
            
            setTimeout(() => {
                bindClockSettingEvents();
            }, 0);
        }
        
        function bindClockSettingEvents() {
            const inputs = clockSettings.querySelectorAll('input');
            inputs.forEach(input => {
                input.onchange = function() {
                    updateClockValues();
                    updateClocks();
                };
            });
        }
        
        function updateClockValues() {
            switch(clockRule) {
                case 'suddenDeath':
                    redBaseTime = parseInt(document.getElementById('redTimeSuddenDeath').value || 20) * 60;
                    blackBaseTime = parseInt(document.getElementById('blackTimeSuddenDeath').value || 20) * 60;
                    break;
                    
                case 'increment':
                    redBaseTime = parseInt(document.getElementById('redTimeIncrement').value || 20) * 60;
                    blackBaseTime = parseInt(document.getElementById('blackTimeIncrement').value || 20) * 60;
                    incrementTime = parseInt(document.getElementById('incrementTime').value || 5);
                    break;
                    
                case 'stepTime':
                    redBaseTime = parseInt(document.getElementById('redTimeStep').value || 20) * 60;
                    blackBaseTime = parseInt(document.getElementById('blackTimeStep').value || 20) * 60;
                    redStepTime = parseInt(document.getElementById('redStepTimeInput').value || 60);
                    blackStepTime = parseInt(document.getElementById('blackStepTimeInput').value || 60);
                    break;
            }
            
            redTime = redBaseTime;
            blackTime = blackBaseTime;
            redStepTimeRemaining = redStepTime;
            blackStepTimeRemaining = blackStepTime;
        }
        
        function updateClocks() {
            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };
            
            redClock.textContent = formatTime(redTime);
            blackClock.textContent = formatTime(blackTime);
            
            if(clockRule === 'stepTime') {
                redStepTimeDisplay.textContent = `步时: ${formatTime(redStepTimeRemaining)}`;
                blackStepTimeDisplay.textContent = `步时: ${formatTime(blackStepTimeRemaining)}`;
            }
            
            redClock.classList.remove('active');
            blackClock.classList.remove('active');
            
            if(clockRunning) {
                if(currentClock === 'red') {
                    redClock.classList.add('active');
                } else {
                    blackClock.classList.add('active');
                }
            }
            
            if(clockRunning) {
                if(redTime <= 0) {
                    gameOver = true;
                    alert('红方时间到，黑方获胜！');
                    stopClock();
                } else if(blackTime <= 0) {
                    gameOver = true;
                    alert('黑方时间到，红方获胜！');
                    stopClock();
                }
                
                if(clockRule === 'stepTime') {
                    if(currentClock === 'red' && redStepTimeRemaining <= 0) {
                        gameOver = true;
                        alert('红方步时用尽，黑方获胜！');
                        stopClock();
                    } else if(currentClock === 'black' && blackStepTimeRemaining <= 0) {
                        gameOver = true;
                        alert('黑方步时用尽，红方获胜！');
                        stopClock();
                    }
                }
            }
        }
        
        function startClock(turn) {
            stopClock();
            currentClock = turn;
            clockRunning = true;
            
            clockInterval = setInterval(() => {
                if(currentClock === 'red') {
                    redTime--;
                } else {
                    blackTime--;
                }
                
                if(clockRule === 'stepTime') {
                    if(currentClock === 'red') {
                        redStepTimeRemaining--;
                    } else {
                        blackStepTimeRemaining--;
                    }
                }
                
                updateClocks();
            }, 1000);
            
            updateClocks();
        }
        
        function pauseClock() {
            if(clockRunning) {
                stopClock();
                document.getElementById('pauseClockBtn').textContent = '继续';
            } else {
                startClock(currentClock);
                document.getElementById('pauseClockBtn').textContent = '暂停';
            }
        }
        
        function stopClock() {
            if(clockInterval) {
                clearInterval(clockInterval);
                clockInterval = null;
            }
            clockRunning = false;
            updateClocks();
        }
        
        function resetClock() {
            stopClock();
            updateClockValues();
            currentClock = 'red';
            updateClocks();
            document.getElementById('pauseClockBtn').textContent = '暂停';
        }
