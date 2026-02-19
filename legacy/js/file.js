// ========== 文件管理功能 ==========
        async function newFile() {
            if (isFileModified) {
                if (!confirm('当前文件已修改，是否保存？')) {
                    return;
                }
                await saveFile();
            }
            
            currentFileHandle = null;
            currentFileName = '未命名棋谱书.json';
            isFileModified = false;
            
            // 清空所有数据
            savedGames = [];
            currentGameId = 0;
            deletedGames = [];
            
            // 重置界面
            renderDefaultLayout();
            updateGameSelect();
            updateFileStatus();
            
            alert('已创建新文件');
        }

        async function openFile() {
            try {
                // 检查文件是否已修改
                if (isFileModified) {
                    if (!confirm('当前文件已修改，是否保存？')) {
                        return;
                    }
                    await saveFile();
                }
                
                // 使用现代File System Access API
                if ('showOpenFilePicker' in window) {
                    const [fileHandle] = await window.showOpenFilePicker({
                        types: [{
                            description: '棋谱文件',
                            accept: {'application/json': ['.json']}
                        }],
                        multiple: false
                    });
                    
                    const file = await fileHandle.getFile();
                    const content = await file.text();
                    
                    currentFileHandle = fileHandle;
                    currentFileName = file.name;
                    isFileModified = false;
                    
                    // 解析文件内容
                    parseFileContent(content);
                    updateFileStatus();
                    
                } else {
                    // 降级方案：使用传统文件选择器
                    document.getElementById('fileInput').click();
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    alert('打开文件失败: ' + err.message);
                }
            }
        }

        function parseFileContent(content) {
    try {
        const data = JSON.parse(content);
        
        if (data.version && data.games) {
            // 新格式：包含版本信息的完整棋谱书
            savedGames = data.games || [];
            
            // ========== 修复：初始化所有片段的underlineMarks属性 ==========
            savedGames.forEach(game => {
                if (game.fragments) {
                    game.fragments.forEach(fragment => {
                        if (!fragment.underlineMarks) {
                            fragment.underlineMarks = {};
                        }
                    });
                }
            });
            // ========== 修复结束 ==========
            
            if (savedGames.length > 0) {
                // 加载第一个棋局
                loadGame(savedGames[0].id);
            } else {
                renderDefaultLayout();
            }
        } else if (Array.isArray(data)) {
            // 旧格式：棋局数组
            savedGames = data;
            
            // ========== 修复：初始化所有片段的underlineMarks属性 ==========
            savedGames.forEach(game => {
                if (game.fragments) {
                    game.fragments.forEach(fragment => {
                        if (!fragment.underlineMarks) {
                            fragment.underlineMarks = {};
                        }
                    });
                }
            });
            // ========== 修复结束 ==========
            
            if (savedGames.length > 0) {
                loadGame(savedGames[0].id);
            } else {
                renderDefaultLayout();
            }
        } else {
            alert('文件格式不正确！');
            return;
        }
        
        updateGameSelect();
        alert(`成功打开文件: ${currentFileName}`);
        
    } catch (error) {
        alert('文件解析失败！');
        console.error(error);
    }
}

        async function saveFile() {
            try {
                const data = {
                    version: '1.0',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    games: savedGames
                };
                
                const content = JSON.stringify(data, null, 2);
                
                if (currentFileHandle && 'showSaveFilePicker' in window) {
                    // 保存到现有文件
                    const writable = await currentFileHandle.createWritable();
                    await writable.write(content);
                    await writable.close();
                    
                    isFileModified = false;
                    updateFileStatus();
                    alert(`已保存到: ${currentFileName}`);
                    
                } else {
                    // 另存为
                    await saveAsFile(content);
                }
            } catch (err) {
                alert('保存文件失败: ' + err.message);
            }
        }

        async function saveAsFile(content = null) {
            if (!content) {
                const data = {
                    version: '1.0',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    games: savedGames
                };
                content = JSON.stringify(data, null, 2);
            }
            
            try {
                if ('showSaveFilePicker' in window) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: currentFileName,
                        types: [{
                            description: '棋谱文件',
                            accept: {'application/json': ['.json']}
                        }]
                    });
                    
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                    
                    currentFileHandle = handle;
                    currentFileName = handle.name;
                    isFileModified = false;
                    updateFileStatus();
                    
                    alert(`已保存到: ${currentFileName}`);
                } else {
                    // 降级方案：创建下载链接
                    const blob = new Blob([content], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = currentFileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    alert(`已下载: ${currentFileName}`);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    alert('保存文件失败: ' + err.message);
                }
            }
        }

        function updateFileStatus() {
            const status = currentFileName;
            if (isFileModified) {
                fileStatus.textContent = `${status} (已修改)`;
                fileStatus.style.background = '#fff3e0';
                fileStatus.style.color = '#ff9800';
            } else {
                fileStatus.textContent = status;
                fileStatus.style.background = '#e8f5e9';
                fileStatus.style.color = '#2e7d32';
            }
        }

        function markFileModified() {
            if (!isFileModified) {
                isFileModified = true;
                updateFileStatus();
            }
        }
