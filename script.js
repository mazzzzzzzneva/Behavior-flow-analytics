class BehaviorAnalyzer {
    constructor() {
        this.mouseData = [];
        this.clickData = [];
        this.scrollData = [];
        this.sessionStart = Date.now();
        this.movementPoints = [];
        this.lastMousePosition = { x: 0, y: 0 };
        this.lastMoveTime = Date.now();
        
        this.initializeMetrics();
        this.setupEventListeners();
        this.startAnalysis();
    }

    initializeMetrics() {
        this.updateMetric('mouseSpeed', '0');
        this.updateMetric('clickCount', '0');
        this.updateMetric('scrollDistance', '0');
        this.updateMetric('sessionTime', '0');
    }

    setupEventListeners() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('scroll', this.handleScroll.bind(this));
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    handleMouseMove(event) {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastMoveTime;
        
        if (timeDiff > 50) {
            const distance = this.calculateDistance(
                this.lastMousePosition.x, this.lastMousePosition.y,
                event.clientX, event.clientY
            );
            
            const speed = distance / (timeDiff / 1000);
            this.mouseData.push({
                x: event.clientX,
                y: event.clientY,
                speed: speed,
                timestamp: currentTime
            });

            this.updateMetric('mouseSpeed', Math.round(speed));
            this.lastMousePosition = { x: event.clientX, y: event.clientY };
            this.lastMoveTime = currentTime;

            this.movementPoints.push({
                x: event.clientX / window.innerWidth,
                y: event.clientY / window.innerHeight,
                time: currentTime
            });
        }
    }

    handleClick(event) {
        this.clickData.push({
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now(),
            pressure: event.pressure || 0.5
        });

        const clickCount = this.clickData.length;
        this.updateMetric('clickCount', clickCount.toString());
        this.updateClickHeatmap(event.clientX, event.clientY);
        this.addTimelineEvent('click', `Клик в позиции (${event.clientX}, ${event.clientY})`);
    }

    handleScroll() {
        const scrollY = window.scrollY;
        this.scrollData.push({
            position: scrollY,
            timestamp: Date.now(),
            velocity: this.calculateScrollVelocity()
        });

        this.updateMetric('scrollDistance', Math.round(scrollY).toString());
    }

    handleKeyPress(event) {
        this.addTimelineEvent('keypress', `Нажата клавиша: ${event.key}`);
    }

    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    calculateScrollVelocity() {
        if (this.scrollData.length < 2) return 0;
        const last = this.scrollData[this.scrollData.length - 1];
        const prev = this.scrollData[this.scrollData.length - 2];
        return Math.abs(last.position - prev.position) / ((last.timestamp - prev.timestamp) / 1000);
    }

    updateMetric(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateClickHeatmap(x, y) {
        const heatmap = document.getElementById('clickHeatmap');
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell active';
        
        const intensity = Math.min(this.clickData.length / 10, 1);
        if (intensity > 0.7) {
            cell.classList.add('intense');
        }
        
        heatmap.appendChild(cell);
        
        if (heatmap.children.length > 50) {
            heatmap.removeChild(heatmap.firstChild);
        }
    }

    addTimelineEvent(type, description) {
        const timeline = document.getElementById('activityTimeline');
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        const time = new Date().toLocaleTimeString();
        const icon = this.getEventIcon(type);
        
        item.innerHTML = `
            <span class="timeline-time">${time}</span>
            <span class="timeline-event">${icon} ${description}</span>
        `;
        
        timeline.appendChild(item);
        timeline.scrollTop = timeline.scrollHeight;
    }

    getEventIcon(type) {
        const icons = {
            click: '🖱️',
            scroll: '📜',
            keypress: '⌨️',
            move: '🎯'
        };
        return icons[type] || '🔔';
    }

    analyzeBehaviorPatterns() {
        const avgSpeed = this.mouseData.length > 0 ? 
            this.mouseData.reduce((sum, point) => sum + point.speed, 0) / this.mouseData.length : 0;
        
        const clickFrequency = this.clickData.length / ((Date.now() - this.sessionStart) / 60000);
        const scrollIntensity = this.scrollData.length > 0 ? 
            Math.max(...this.scrollData.map(s => s.velocity)) : 0;

        return {
            avgSpeed,
            clickFrequency,
            scrollIntensity,
            movementConsistency: this.calculateMovementConsistency(),
            decisionSpeed: this.calculateDecisionSpeed()
        };
    }

    calculateMovementConsistency() {
        if (this.movementPoints.length < 10) return 0.5;
        
        const speeds = [];
        for (let i = 1; i < this.movementPoints.length; i++) {
            const dist = this.calculateDistance(
                this.movementPoints[i-1].x,
                this.movementPoints[i-1].y,
                this.movementPoints[i].x,
                this.movementPoints[i].y
            );
            const timeDiff = this.movementPoints[i].time - this.movementPoints[i-1].time;
            speeds.push(dist / (timeDiff / 1000));
        }
        
        const avg = speeds.reduce((a, b) => a + b) / speeds.length;
        const variance = speeds.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / speeds.length;
        return Math.max(0, 1 - (variance / 10000));
    }

    calculateDecisionSpeed() {
        if (this.clickData.length < 2) return 0.5;
        const times = this.clickData.map(c => c.timestamp).sort((a, b) => a - b);
        const intervals = [];
        for (let i = 1; i < times.length; i++) {
            intervals.push(times[i] - times[i-1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        return Math.min(1, 1000 / avgInterval);
    }

    generatePersonalityProfile(patterns) {
        const traits = [];
        
        if (patterns.avgSpeed > 500) {
            traits.push({ name: 'Решительный', class: 'confident' });
        } else if (patterns.avgSpeed < 200) {
            traits.push({ name: 'Внимательный', class: 'cautious' });
        }

        if (patterns.clickFrequency > 5) {
            traits.push({ name: 'Активный', class: 'impulsive' });
        }

        if (patterns.movementConsistency > 0.7) {
            traits.push({ name: 'Системный', class: 'confident' });
        }

        if (patterns.decisionSpeed > 0.8) {
            traits.push({ name: 'Быстрореагирующий', class: 'impulsive' });
        }

        if (patterns.scrollIntensity > 100) {
            traits.push({ name: 'Энергичный', class: 'impulsive' });
        }

        return traits.length > 0 ? traits : [{ name: 'Сбалансированный', class: 'confident' }];
    }

    generateInsight(patterns, traits) {
        if (patterns.avgSpeed > 600 && patterns.clickFrequency > 8) {
            return "Вы демонстрируете энергичный и целеустремленный стиль взаимодействия";
        } else if (patterns.avgSpeed < 300 && patterns.movementConsistency > 0.8) {
            return "Ваш подход отличается методичностью и вниманием к деталям";
        } else if (patterns.decisionSpeed > 0.9) {
            return "Вы быстро принимаете решения и действуете интуитивно";
        } else {
            return "Вы проявляете адаптивный и сбалансированный стиль поведения";
        }
    }

    updateAnalysis() {
        const patterns = this.analyzeBehaviorPatterns();
        const traits = this.generatePersonalityProfile(patterns);
        const insight = this.generateInsight(patterns, traits);

        const mouseProgress = document.getElementById('mouseActivityProgress');
        mouseProgress.style.width = `${Math.min(patterns.avgSpeed / 10, 100)}%`;

        this.updateMetric('avgSpeed', `${Math.round(patterns.avgSpeed)} px/сек`);
        this.updateMetric('clickActivity', `${Math.round(patterns.clickFrequency * 10) / 10}/мин`);
        this.updateMetric('scrollPattern', patterns.scrollIntensity > 100 ? 'Энергичный' : 'Плавный');

        const traitsContainer = document.getElementById('personalityTraits');
        traitsContainer.innerHTML = '';
        traits.forEach(trait => {
            const traitElement = document.createElement('div');
            traitElement.className = `trait ${trait.class}`;
            traitElement.textContent = trait.name;
            traitsContainer.appendChild(traitElement);
        });

        document.getElementById('behaviorInsight').textContent = insight;
    }

    startAnalysis() {
        setInterval(() => {
            const sessionTime = Math.round((Date.now() - this.sessionStart) / 1000);
            this.updateMetric('sessionTime', sessionTime.toString());
        }, 1000);

        setInterval(() => {
            this.updateAnalysis();
        }, 3000);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, запускаем анализатор...');
    
    try {
        new BehaviorAnalyzer();
        console.log('Анализатор запущен успешно!');
    } catch (error) {
        console.error('Ошибка при запуске анализатора:', error);
    }
});