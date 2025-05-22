// 在页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 减去导航栏高度
                    behavior: 'smooth'
                });
            }
        });
    });

    // 添加阅读进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.appendChild(progressBar);
    
    document.body.prepend(progressContainer);
    
    // 监听滚动事件，更新进度条
    window.addEventListener('scroll', function() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.scrollY;
        
        const progress = (scrollTop / documentHeight) * 100;
        progressBar.style.width = progress + '%';
    });
    
    // 为导航栏添加滚动时的样式变化
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 10) {
            nav.classList.add('shadow-md');
            nav.style.backdropFilter = 'blur(10px)';
            nav.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        } else {
            nav.classList.remove('shadow-md');
            nav.style.backdropFilter = 'none';
            nav.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        }
    });
    
    // 为目录卡片添加悬停效果
    const menuCards = document.querySelectorAll('.grid a');
    menuCards.forEach(card => {
        card.classList.add('hover-card');
    });
    
    // 添加动态高亮当前阅读的部分
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('text-blue-500', 'font-semibold');
            link.classList.add('text-gray-500');
            
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.remove('text-gray-500');
                link.classList.add('text-blue-500', 'font-semibold');
            }
        });
    });

    // 添加板块进入视口时的动画效果
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                // 一旦动画触发，就不再观察该元素
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 观察所有板块
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
    
    // 稳定币市场份额饼状图
    if (document.getElementById('stablecoinChart')) {
        loadStablecoinData();
    }
});

// 加载稳定币市场数据
async function loadStablecoinData() {
    try {
        // 从CoinGecko API获取稳定币数据
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=20&page=1&sparkline=false');
        const data = await response.json();
        
        // 过滤出市值前10的稳定币
        const top10Stablecoins = data.slice(0, 10);
        
        // 准备图表数据
        const chartLabels = top10Stablecoins.map(coin => coin.symbol.toUpperCase());
        const chartData = top10Stablecoins.map(coin => coin.market_cap);
        const chartColors = [
            '#4299E1', // USDT - 蓝色
            '#48BB78', // USDC - 绿色
            '#F6AD55', // USDS - 橙色
            '#FC8181', // USDE - 红色
            '#9F7AEA', // DAI - 紫色
            '#667EEA', // SUSDS - 靛蓝色
            '#ECC94B', // USD1 - 金色
            '#F687B3', // FDUSD - 粉色
            '#B794F4', // PYUSD - 淡紫色
            '#805AD5', // XAUT - 深紫色
        ];
        
        // 计算总市值
        const totalMarketCap = top10Stablecoins.reduce((sum, coin) => sum + coin.market_cap, 0);
        
        // 更新UI中的数据信息
        document.getElementById('totalMarketCap').textContent = formatCurrency(totalMarketCap);
        document.getElementById('updateTime').textContent = new Date().toLocaleString();
        
        // 保存全局数据供图表模式切换使用
        window.stablecoinData = {
            labels: chartLabels,
            data: chartData,
            colors: chartColors,
            totalMarketCap: totalMarketCap
        };
        
        // 渲染当前选择的图表类型
        renderCurrentChartType();
        
        // 添加稳定币类型标记
        addStablecoinTypeLabels(top10Stablecoins);
        
        // 绑定图表类型切换按钮事件
        bindChartTypeButtons();
        
        // 绑定刷新数据按钮事件
        document.getElementById('refreshDataBtn').addEventListener('click', function() {
            // 显示加载指示器
            document.getElementById('stablecoinChart').innerHTML = '<div class="flex justify-center items-center h-full"><p class="text-gray-500">正在更新数据...</p></div>';
            // 重新加载数据
            loadStablecoinData();
        });
        
    } catch (error) {
        console.error('加载稳定币数据失败:', error);
        document.getElementById('stablecoinChart').innerHTML = '<p class="text-red-500 text-center">数据加载失败，请稍后再试</p>';
    }
}

// 绑定图表类型切换按钮事件
function bindChartTypeButtons() {
    // 获取按钮元素
    const pieChartBtn = document.getElementById('pieChartBtn');
    const donutChartBtn = document.getElementById('donutChartBtn');
    const barChartBtn = document.getElementById('barChartBtn');
    
    // 移除现有事件监听器（避免重复绑定）
    pieChartBtn.removeEventListener('click', switchToPieChart);
    donutChartBtn.removeEventListener('click', switchToDonutChart);
    barChartBtn.removeEventListener('click', switchToBarChart);
    
    // 添加新的事件监听器
    pieChartBtn.addEventListener('click', switchToPieChart);
    donutChartBtn.addEventListener('click', switchToDonutChart);
    barChartBtn.addEventListener('click', switchToBarChart);
}

// 切换到饼状图
function switchToPieChart() {
    // 更新按钮状态
    updateButtonStates('pieChartBtn');
    // 设置当前图表类型
    window.currentChartType = 'pie';
    // 重新渲染图表
    renderCurrentChartType();
}

// 切换到环形图
function switchToDonutChart() {
    // 更新按钮状态
    updateButtonStates('donutChartBtn');
    // 设置当前图表类型
    window.currentChartType = 'doughnut';
    // 重新渲染图表
    renderCurrentChartType();
}

// 切换到柱状图
function switchToBarChart() {
    // 更新按钮状态
    updateButtonStates('barChartBtn');
    // 设置当前图表类型
    window.currentChartType = 'bar';
    // 重新渲染图表
    renderCurrentChartType();
}

// 更新按钮状态
function updateButtonStates(activeButtonId) {
    const buttons = ['pieChartBtn', 'donutChartBtn', 'barChartBtn'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btnId === activeButtonId) {
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            btn.classList.add('bg-blue-500', 'text-white');
        } else {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        }
    });
}

// 渲染当前选择的图表类型
function renderCurrentChartType() {
    // 如果没有设置当前图表类型，默认为饼图
    if (!window.currentChartType) {
        window.currentChartType = 'pie';
        updateButtonStates('pieChartBtn');
    }
    
    // 获取保存的稳定币数据
    const data = window.stablecoinData;
    
    // 根据当前图表类型渲染
    switch (window.currentChartType) {
        case 'pie':
            renderStablecoinChart(data.labels, data.data, data.colors);
            break;
        case 'doughnut':
            renderDonutChart(data.labels, data.data, data.colors);
            break;
        case 'bar':
            renderBarChart(data.labels, data.data, data.colors);
            break;
        default:
            renderStablecoinChart(data.labels, data.data, data.colors);
    }
}

// 渲染稳定币饼状图
function renderStablecoinChart(labels, data, colors) {
    const ctx = document.getElementById('stablecoinChart').getContext('2d');
    
    // 销毁已存在的图表实例（如果有）
    if (window.stablecoinChartInstance) {
        window.stablecoinChartInstance.destroy();
    }
    
    // 计算市场份额百分比
    const total = data.reduce((sum, value) => sum + value, 0);
    const percentages = data.map(value => ((value / total) * 100).toFixed(2));
    
    // 创建带有百分比的标签
    const labelsWithPercentage = labels.map((label, index) => {
        return `${label} (${percentages[index]}%)`;
    });
    
    // 创建新的图表实例
    window.stablecoinChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labelsWithPercentage,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label.split(' (')[0];
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

// 渲染环形图
function renderDonutChart(labels, data, colors) {
    const ctx = document.getElementById('stablecoinChart').getContext('2d');
    
    // 销毁已存在的图表实例（如果有）
    if (window.stablecoinChartInstance) {
        window.stablecoinChartInstance.destroy();
    }
    
    // 计算市场份额百分比
    const total = data.reduce((sum, value) => sum + value, 0);
    const percentages = data.map(value => ((value / total) * 100).toFixed(2));
    
    // 创建带有百分比的标签
    const labelsWithPercentage = labels.map((label, index) => {
        return `${label} (${percentages[index]}%)`;
    });
    
    // 创建新的图表实例
    window.stablecoinChartInstance = new Chart(ctx, {
        type: 'doughnut', // 环形图
        data: {
            labels: labelsWithPercentage,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%', // 中心孔大小
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label.split(' (')[0];
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

// 渲染柱状图
function renderBarChart(labels, data, colors) {
    const ctx = document.getElementById('stablecoinChart').getContext('2d');
    
    // 销毁已存在的图表实例（如果有）
    if (window.stablecoinChartInstance) {
        window.stablecoinChartInstance.destroy();
    }
    
    // 计算市场份额百分比
    const total = data.reduce((sum, value) => sum + value, 0);
    
    // 创建新的图表实例
    window.stablecoinChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '市值 (USD)',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // 横向柱状图
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = formatCurrency(context.raw);
                            const percentage = ((context.raw / total) * 100).toFixed(2);
                            return `市值: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return '$' + (value / 100000000).toFixed(1) + '亿';
                            } else if (value >= 1000000) {
                                return '$' + (value / 10000).toFixed(1) + '万';
                            }
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// 格式化货币数值
function formatCurrency(value) {
    if (value >= 1000000000) {
        return '$' + (value / 100000000).toFixed(2) + '亿';
    } else if (value >= 1000000) {
        return '$' + (value / 10000).toFixed(2) + '万';
    } else {
        return '$' + value.toLocaleString();
    }
}

// 添加稳定币类型标记
function addStablecoinTypeLabels(stablecoins) {
    // 稳定币类型映射
    const stablecoinTypes = {
        'usdt': '资产支持型',
        'usdc': '资产支持型',
        'busd': '资产支持型',
        'dai': '算法稳定币',
        'tusd': '资产支持型',
        'usdd': '算法稳定币',
        'usdp': '资产支持型',
        'gusd': '资产支持型',
        'frax': '混合型',
        'lusd': '算法稳定币',
        'fei': '算法稳定币',
        'susd': '合成型',
        'musd': '混合型',
        'ust': '算法稳定币(已崩盘)',
        'usd1': '资产支持型',
        'usds': '资产支持型',
        'usde': '合成型',
        'susds': '资产支持型',
        'fdusd': '资产支持型',
        'pyusd': '资产支持型',
        'xaut': '黄金支持型',
    };
    
    // 创建稳定币类型表格
    let tableHTML = `
        <div class="mt-6">
            <h4 class="font-medium mb-2">稳定币类型:</h4>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="px-3 py-2 text-left">符号</th>
                            <th class="px-3 py-2 text-left">名称</th>
                            <th class="px-3 py-2 text-left">类型</th>
                            <th class="px-3 py-2 text-right">市值</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    stablecoins.forEach(coin => {
        const type = stablecoinTypes[coin.symbol.toLowerCase()] || '其他';
        tableHTML += `
            <tr class="border-t">
                <td class="px-3 py-2">${coin.symbol.toUpperCase()}</td>
                <td class="px-3 py-2">${coin.name}</td>
                <td class="px-3 py-2">
                    <span class="inline-block px-2 py-1 rounded-full text-xs ${getTypeColorClass(type)}">
                        ${type}
                    </span>
                </td>
                <td class="px-3 py-2 text-right">${formatCurrency(coin.market_cap)}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // 插入表格到图表区域
    const chartContainer = document.querySelector('#stablecoinChart').closest('.flex');
    const infoContainer = chartContainer.querySelector('.md\\:w-1\\/3 .bg-gray-50');
    
    // 检查是否已存在表格，如果存在则替换
    const existingTable = infoContainer.querySelector('.mt-6');
    if (existingTable) {
        existingTable.remove();
    }
    
    // 添加新表格
    infoContainer.insertAdjacentHTML('beforeend', tableHTML);
    
    // 设置定时自动更新
    setTimeout(loadStablecoinData, 300000); // 每5分钟更新一次
}

// 获取稳定币类型的颜色类
function getTypeColorClass(type) {
    switch(type) {
        case '资产支持型':
            return 'bg-blue-100 text-blue-800';
        case '算法稳定币':
            return 'bg-green-100 text-green-800';
        case '混合型':
            return 'bg-purple-100 text-purple-800';
        case '合成型':
            return 'bg-yellow-100 text-yellow-800';
        case '算法稳定币(已崩盘)':
            return 'bg-red-100 text-red-800';
        case '黄金支持型':
            return 'bg-amber-100 text-amber-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
