/*!
 * Chart.js v4.4.0 - Minimal Pie Chart Implementation
 * https://www.chartjs.org
 * (c) 2023 Chart.js Contributors
 * Released under the MIT License
 * 
 * This is a minimal implementation for pie charts only
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = global || self, global.Chart = factory());
}(this, (function () {
    'use strict';

    class Chart {
        constructor(ctx, config) {
            this.ctx = ctx;
            this.config = config;
            this.canvas = ctx.canvas;
            this.destroyed = false;

            // Set canvas size
            const canvas = this.canvas;
            const rect = canvas.getBoundingClientRect();
            const devicePixelRatio = window.devicePixelRatio || 1;

            canvas.width = rect.width * devicePixelRatio;
            canvas.height = rect.height * devicePixelRatio;

            ctx.scale(devicePixelRatio, devicePixelRatio);

            // Draw the chart
            this.draw();
        }

        draw() {
            if (this.destroyed) return;

            const ctx = this.ctx;
            const canvas = this.canvas;
            const data = this.config.data;
            const options = this.config.options || {};

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (this.config.type === 'pie') {
                this.drawPieChart(ctx, data, options);
            }
        }

        drawPieChart(ctx, data, options) {
            const canvas = this.canvas;
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const radius = Math.min(centerX, centerY) - 40; // Leave space for legend

            const values = data.datasets[0].data;
            const labels = data.labels;
            const colors = data.datasets[0].backgroundColor;
            const borderColors = data.datasets[0].borderColor || colors;
            const borderWidth = data.datasets[0].borderWidth || 0;

            const total = values.reduce((sum, val) => sum + val, 0);
            if (total === 0) return;

            let currentAngle = -Math.PI / 2; // Start at top

            // Draw pie slices
            values.forEach((value, index) => {
                const sliceAngle = (value / total) * 2 * Math.PI;

                // Draw slice
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();

                ctx.fillStyle = colors[index];
                ctx.fill();

                if (borderWidth > 0) {
                    ctx.strokeStyle = borderColors[index];
                    ctx.lineWidth = borderWidth;
                    ctx.stroke();
                }

                currentAngle += sliceAngle;
            });

            // Draw legend
            this.drawLegend(ctx, labels, colors, rect);

            // Add hover functionality
            this.addHoverHandlers(canvas, centerX, centerY, radius, values, labels, total);
        }

        drawLegend(ctx, labels, colors, rect) {
            const legendY = rect.height - 30;
            const legendItemWidth = rect.width / labels.length;

            labels.forEach((label, index) => {
                const x = (index * legendItemWidth) + (legendItemWidth / 2);

                // Draw color box
                ctx.fillStyle = colors[index];
                ctx.fillRect(x - 15, legendY - 5, 10, 10);

                // Draw label
                ctx.fillStyle = '#333';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(label, x, legendY + 15);
            });
        }

        addHoverHandlers(canvas, centerX, centerY, radius, values, labels, total) {
            const tooltip = this.config.options?.plugins?.tooltip;
            if (!tooltip) return;

            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (distance <= radius) {
                    const angle = Math.atan2(y - centerY, x - centerX) + Math.PI / 2;
                    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

                    let currentAngle = 0;
                    for (let i = 0; i < values.length; i++) {
                        const sliceAngle = (values[i] / total) * 2 * Math.PI;
                        if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
                            this.showTooltip(e, i, values[i], labels[i], tooltip);
                            canvas.style.cursor = 'pointer';
                            return;
                        }
                        currentAngle += sliceAngle;
                    }
                }
                canvas.style.cursor = 'default';
                this.hideTooltip();
            });

            canvas.addEventListener('mouseleave', () => {
                this.hideTooltip();
                canvas.style.cursor = 'default';
            });
        }

        showTooltip(e, index, value, label, tooltipConfig) {
            this.hideTooltip();

            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 1000;
                left: ${e.pageX + 10}px;
                top: ${e.pageY - 10}px;
            `;

            let content = `${label}: ${value}`;
            if (tooltipConfig.callbacks && tooltipConfig.callbacks.label) {
                const context = {
                    dataIndex: index,
                    raw: value,
                    label: label,
                    dataset: { data: [value] }
                };
                content = tooltipConfig.callbacks.label(context);
            }

            tooltip.textContent = content;
            document.body.appendChild(tooltip);
            this.currentTooltip = tooltip;
        }

        hideTooltip() {
            if (this.currentTooltip) {
                this.currentTooltip.remove();
                this.currentTooltip = null;
            }
        }

        destroy() {
            this.destroyed = true;
            this.hideTooltip();
        }

        update() {
            if (!this.destroyed) {
                this.draw();
            }
        }
    }

    return Chart;
})));