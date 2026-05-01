/**
 * ParkQuest 踩点助手 - 主逻辑文件
 * 功能：GPS定位、语音输入、AI生成、拍照保存、上传云端
 */

// ==================== 全局状态 ====================
let currentPosition = null;        // 当前GPS坐标
let savedTaskPoints = [];          // 本地保存的任务点列表
let currentPhoto = null;           // 当前拍摄的照片(base64)
let recognition = null;            // 语音识别对象
let voiceTargetField = null;       // 语音输入目标字段ID
let isAIVoice = false;             // 是否AI语音输入模式

// 配置信息（从localStorage读取）
let config = {
    tcbEnvId: localStorage.getItem('tcb_envid') || '',
    qwenApiKey: localStorage.getItem('qwen_apikey') || ''
};

// 腾讯云开发实例
let app = null;
let db = null;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化语音识别
    initSpeechRecognition();

    // 检查是否有保存的配置
    if (config.tcbEnvId) {
        // 有配置，直接进入主界面
        showMainPanel();
        initCloudBase();
        startGPS();
    } else {
        // 无配置，显示配置面板，填充可能部分保存的值
        document.getElementById('tcb-envid').value = config.tcbEnvId;
        document.getElementById('qwen-apikey').value = config.qwenApiKey;
    }
});

// ==================== 配置管理 ====================

/**
 * 保存配置到本地存储
 */
function saveConfig() {
    config.tcbEnvId = document.getElementById('tcb-envid').value.trim();
    config.qwenApiKey = document.getElementById('qwen-apikey').value.trim();

    if (!config.tcbEnvId) {
        showToast('❌ 请填写腾讯云环境 ID');
        return;
    }

    // 保存到浏览器本地存储
    localStorage.setItem('tcb_envid', config.tcbEnvId);
    localStorage.setItem('qwen_apikey', config.qwenApiKey);

    showMainPanel();
    initCloudBase();
    startGPS();
    showToast('✅ 配置已保存');
}

/**
 * 切换到主界面
 */
function showMainPanel() {
    document.getElementById('config-panel').classList.add('hidden');
    document.getElementById('main-panel').classList.remove('hidden');
}

// ==================== 腾讯云开发初始化 ====================

/**
 * 初始化腾讯云开发 CloudBase
 */
function initCloudBase() {
    try {
        // 初始化 CloudBase 应用
        app = tcb.init({
            env: config.tcbEnvId
        });

        // 匿名登录
        app.auth().anonymousAuthProvider().signIn().then(() => {
            console.log('腾讯云开发登录成功');
        }).catch(err => {
            console.error('登录失败:', err);
            showToast('⚠️ 登录失败，请检查环境 ID');
        });

        // 获取数据库实例
        db = app.database();
        console.log('腾讯云开发初始化成功');
    } catch (e) {
        console.error('腾讯云开发初始化失败:', e);
        showToast('⚠️ 腾讯云连接失败');
    }
}

// ==================== GPS 定位 ====================

/**
 * 开始监听 GPS 位置
 */
function startGPS() {
    if (!navigator.geolocation) {
        showToast('❌ 浏览器不支持定位');
        document.getElementById('gps-text').textContent = '浏览器不支持';
        return;
    }

    document.getElementById('gps-text').textContent = '定位中...';
    document.getElementById('gps-coords').textContent = '正在请求位置权限...';

    // 首先使用 getCurrentPosition 获取一次位置（触发权限请求）
    navigator.geolocation.getCurrentPosition(
        (position) => {
            // 获取成功，更新位置
            updatePosition(position);
            // 然后持续监听
            startWatchPosition();
        },
        (error) => {
            handleGPSError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

/**
 * 更新位置信息
 */
function updatePosition(position) {
    currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
    };

    const coordsText = `${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`;
    document.getElementById('gps-coords').textContent =
        `${coordsText} (精度: ${Math.round(currentPosition.accuracy)}米)`;
    document.getElementById('gps-text').textContent = '✓ 定位成功';
    document.getElementById('gps-status').style.background = 'rgba(0,255,136,0.1)';
    document.getElementById('gps-status').style.borderColor = 'var(--success)';
}

/**
 * 处理 GPS 错误
 */
function handleGPSError(error) {
    console.error('定位错误:', error);
    let message = '定位失败';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = '请允许位置权限';
            break;
        case error.POSITION_UNAVAILABLE:
            message = '无法获取位置信息';
            break;
        case error.TIMEOUT:
            message = '定位超时，请重试';
            break;
    }
    document.getElementById('gps-text').textContent = '✗ ' + message;
    document.getElementById('gps-coords').textContent = '点击刷新按钮重试';
    document.getElementById('gps-status').style.background = 'rgba(255,51,102,0.1)';
    document.getElementById('gps-status').style.borderColor = 'var(--error)';
    showToast('❌ ' + message);
}

/**
 * 持续监听位置
 */
function startWatchPosition() {
    navigator.geolocation.watchPosition(
        updatePosition,
        handleGPSError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

/**
 * 手动刷新 GPS
 */
function refreshGPS() {
    startGPS();
    showToast('🔄 正在刷新位置...');
}

/**
 * 更新 GPS 状态显示
 */
function updateGPSStatus(text, status) {
    const statusEl = document.getElementById('gps-status');
    const textEl = document.getElementById('gps-text');

    textEl.textContent = text;

    // 根据状态改变背景色
    statusEl.style.background =
        status === 'success' ? '#E8F5E9' :
        status === 'error' ? '#FFEBEE' : '#E3F2FD';
}

// ==================== 语音识别 ====================

/**
 * 初始化 Web Speech API
 */
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('浏览器不支持语音识别');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';        // 中文识别
    recognition.continuous = false;     // 不连续识别
    recognition.interimResults = true;  // 返回临时结果

    // 识别到结果时触发
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }

        // 实时显示识别结果
        const resultEl = document.getElementById('voice-result');
        if (resultEl) resultEl.textContent = transcript;

        // 如果是最终结果
        if (!event.results[0].isFinal) return;

        // 根据模式写入不同位置
        if (isAIVoice) {
            document.getElementById('ai-prompt').value = transcript;
        } else if (voiceTargetField) {
            const el = document.getElementById(voiceTargetField);
            if (el) el.value = transcript;
        }

        closeVoiceModal();
    };

    // 识别错误时触发
    recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        showToast('❌ 语音识别失败');
        closeVoiceModal();
    };

    // 识别结束时触发
    recognition.onend = () => {
        closeVoiceModal();
    };
}

/**
 * 开始语音输入到指定字段
 */
function startVoiceInput(fieldId) {
    if (!recognition) {
        showToast('❌ 浏览器不支持语音输入');
        return;
    }

    voiceTargetField = fieldId;
    isAIVoice = false;
    showVoiceModal();

    try {
        recognition.start();
    } catch (e) {
        showToast('❌ 无法启动语音识别');
    }
}

/**
 * 开始 AI 语音输入
 */
function startAIVoice(e) {
    if (e) e.preventDefault();

    if (!recognition) {
        showToast('❌ 浏览器不支持语音输入');
        return;
    }

    isAIVoice = true;
    voiceTargetField = null;
    showVoiceModal();

    // 添加录音动画效果
    const wave = document.getElementById('voice-wave');
    if (wave) wave.classList.add('recording');

    try {
        recognition.start();
    } catch (e) {
        showToast('❌ 无法启动语音识别');
    }
}

/**
 * 停止 AI 语音输入
 */
function stopAIVoice() {
    const wave = document.getElementById('voice-wave');
    if (wave) wave.classList.remove('recording');

    if (recognition) {
        recognition.stop();
    }
}

/**
 * 显示语音弹窗
 */
function showVoiceModal() {
    document.getElementById('voice-modal').classList.remove('hidden');
    document.getElementById('voice-result').textContent = '';
}

/**
 * 关闭语音弹窗
 */
function closeVoiceModal() {
    const wave = document.getElementById('voice-wave');
    if (wave) wave.classList.remove('recording');
    document.getElementById('voice-modal').classList.add('hidden');
}

/**
 * 取消语音输入
 */
function cancelVoice() {
    if (recognition) recognition.stop();
    closeVoiceModal();
}

// ==================== AI 生成 ====================

/**
 * 调用通义千问 API 生成任务点内容
 */
async function generateWithAI() {
    const prompt = document.getElementById('ai-prompt').value.trim();

    if (!prompt) {
        showToast('❌ 请先描述你的想法');
        return;
    }

    if (!config.qwenApiKey) {
        showToast('❌ 请先配置通义千问 API Key');
        document.getElementById('config-panel').classList.remove('hidden');
        document.getElementById('main-panel').classList.add('hidden');
        return;
    }

    showLoading('🤖 AI 正在创作...');

    try {
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.qwenApiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个 AR 实景探秘游戏的剧情设计师。根据用户的想法，生成一个任务点的完整信息。
请用以下 JSON 格式返回：
{
  "name": "任务点名称（简洁有趣）",
  "clue": "给玩家的线索提示（简短）",
  "hint": "详细提示（30-50字）",
  "target": "AI识别用的目标描述（描述要找的目标外观特征）"
}`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            throw new Error(`API 错误: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);

        // 填充表单
        document.getElementById('task-name').value = result.name || '';
        document.getElementById('task-clue').value = result.clue || '';
        document.getElementById('task-hint').value = result.hint || '';
        document.getElementById('task-target').value = result.target || '';

        showToast('✅ AI 生成完成！');
    } catch (error) {
        console.error('AI 生成错误:', error);
        showToast('❌ AI 生成失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ==================== 拍照 ====================

/**
 * 处理照片选择/拍摄
 */
function onPhotoSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        currentPhoto = e.target.result;  // base64 格式的图片
        document.getElementById('photo-placeholder').classList.add('hidden');
        document.getElementById('photo-preview').src = currentPhoto;
        document.getElementById('photo-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// ==================== 本地保存 ====================

/**
 * 保存当前任务点到本地列表
 */
function saveTaskPoint() {
    if (!currentPosition) {
        showToast('❌ 请等待 GPS 定位成功');
        return;
    }

    const name = document.getElementById('task-name').value.trim();
    const clue = document.getElementById('task-clue').value.trim();
    const hint = document.getElementById('task-hint').value.trim();
    const target = document.getElementById('task-target').value.trim();

    if (!name) {
        showToast('❌ 请填写任务点名称');
        return;
    }

    // 创建任务点对象
    const taskPoint = {
        id: Date.now(),
        name,
        clue,
        hint,
        target,
        lat: currentPosition.lat,
        lng: currentPosition.lng,
        photo: currentPhoto,
        createdAt: new Date().toISOString()
    };

    savedTaskPoints.push(taskPoint);
    updateSavedList();
    clearForm();

    showToast('✅ 已保存到本地');
}

/**
 * 更新已保存列表显示
 */
function updateSavedList() {
    const listEl = document.getElementById('saved-list');
    const countEl = document.getElementById('saved-count');
    const uploadBtn = document.getElementById('upload-btn');

    countEl.textContent = savedTaskPoints.length;
    uploadBtn.disabled = savedTaskPoints.length === 0;

    if (savedTaskPoints.length === 0) {
        listEl.innerHTML = '<p class="empty-hint">暂无任务点，开始踩点吧！</p>';
        return;
    }

    listEl.innerHTML = savedTaskPoints.map(tp => `
        <div class="saved-item">
            <div class="saved-item-info">
                <h4>${tp.name}</h4>
                <p>${tp.lat.toFixed(6)}, ${tp.lng.toFixed(6)}</p>
            </div>
            <div class="saved-item-actions">
                ${tp.photo ? '<span>📷</span>' : ''}
                <button class="btn-delete" onclick="deleteTaskPoint(${tp.id})">删除</button>
            </div>
        </div>
    `).join('');
}

/**
 * 删除任务点
 */
function deleteTaskPoint(id) {
    if (!confirm('确定删除这个任务点吗？')) return;

    savedTaskPoints = savedTaskPoints.filter(tp => tp.id !== id);
    updateSavedList();
}

/**
 * 清空表单
 */
function clearForm() {
    document.getElementById('task-name').value = '';
    document.getElementById('task-clue').value = '';
    document.getElementById('task-hint').value = '';
    document.getElementById('task-target').value = '';
    document.getElementById('ai-prompt').value = '';

    currentPhoto = null;
    document.getElementById('photo-placeholder').classList.remove('hidden');
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('photo-input').value = '';
}

// ==================== 上传云端 ====================

/**
 * 批量上传所有任务点到腾讯云开发
 */
async function uploadAll() {
    if (savedTaskPoints.length === 0) {
        showToast('❌ 没有可上传的任务点');
        return;
    }

    if (!config.tcbEnvId) {
        showToast('❌ 请先配置腾讯云开发');
        return;
    }

    showLoading(`☁️ 正在上传 ${savedTaskPoints.length} 个任务点...`);

    try {
        // 创建剧本（Quest）集合
        const questResult = await db.collection('quests').add({
            data: {
                title: '新川公园西区踩点_' + new Date().toLocaleDateString(),
                description: '网页版踩点助手采集的数据',
                location: '新川公园西区',
                status: 'draft',
                createdAt: new Date()
            }
        });

        const questId = questResult._id;

        // 上传每个任务点
        for (let i = 0; i < savedTaskPoints.length; i++) {
            const tp = savedTaskPoints[i];

            let photoUrl = null;

            // 如有照片则上传
            if (tp.photo) {
                const fileName = `task_${Date.now()}_${i}.jpg`;
                const base64Data = tp.photo.split(',')[1];
                const uploadResult = await app.uploadFile({
                    cloudPath: `photos/${fileName}`,
                    fileContent: base64Data
                });
                photoUrl = uploadResult.fileID;
            }

            // 创建任务点（Task）集合
            await db.collection('tasks').add({
                data: {
                    questId: questId,
                    order: i + 1,
                    name: tp.name,
                    clue: tp.clue,
                    hint: tp.hint,
                    targetDescription: tp.target,
                    latitude: tp.lat,
                    longitude: tp.lng,
                    photoUrl: photoUrl,
                    createdAt: new Date()
                }
            });
        }

        showToast(`✅ 上传成功！剧本ID: ${questId}`);

        // 清空本地数据
        savedTaskPoints = [];
        updateSavedList();

    } catch (error) {
        console.error('上传错误:', error);
        showToast('❌ 上传失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ==================== UI 工具 ====================

/**
 * 显示加载中
 */
function showLoading(text = '处理中...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading').classList.remove('hidden');
}

/**
 * 隐藏加载中
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * 显示 Toast 提示
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
