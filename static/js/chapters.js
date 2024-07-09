(() => {
    // MarkersDisplay class extends the Video.js Component
    class MarkersDisplay extends videojs.getComponent('Component') {
        constructor(player, options = {}) {
            super(player, options);

            // Bind methods to ensure proper context
            this.resetChildren = this.resetChildren.bind(this);
            this.loadMarkers = this.loadMarkers.bind(this);
            this.onProgressBarHover = this.onProgressBarHover.bind(this);

            // Add event listeners
            this.player().on('loadstart', this.resetChildren);
            this.player().on('loadeddata', this.loadMarkers);
            this.player().on('playerreset', this.resetChildren);
        }

        // Load markers from text track
        loadMarkers() {
            const chapterTrack = Array.from(this.player().textTracks()).find(track => track.label === 'chapter-markers');
            if (!chapterTrack) {
                this.addChild('marker-empty', { className: 'marker-empty', componentClass: 'MarkerDisplay', startTime: 0, endTime: this.player().duration() });
                return;
            }

            const cues = chapterTrack.cues_;
            const gap = videojs.computedStyle(this.el(), 'gap');

            // Create marker elements for each cue
            cues.forEach((cue, index, cues) => {
                const startTime = cue.startTime;
                const label = JSON.parse(cue.text).label;

                if (this.player().duration() > startTime) {
                    if (index === 0 && startTime > 0) {
                        this.addChild('marker-empty', { className: 'marker-empty', componentClass: 'MarkerDisplay', endTime: startTime, gap, startTime: 0, label });
                    }

                    const nextCue = cues[index + 1];
                    this.addChild(`marker-${index}`, { className: `marker-${index}`, componentClass: 'MarkerDisplay', endTime: cue.endTime, gap: nextCue ? gap : undefined, startTime, label });
                }
            });

            const progressControl = this.player().getChild('ControlBar').getChild('ProgressControl');
            progressControl.on('mousemove', this.onProgressBarHover);
            progressControl.on('mouseleave', () => {
                this.el().querySelectorAll('.cst-marker').forEach(marker => marker.classList.remove('show-label'));
            });
        }

        // Handle progress bar hover events
        onProgressBarHover(event) {
            const mouseTime = this.player().getChild('ControlBar').getChild('ProgressControl').getChild('SeekBar').getChild('MouseTimeDisplay').getMouseTime(event);

            this.el().querySelectorAll('.cst-marker').forEach(marker => marker.classList.remove('show-label'));

            const marker = Array.from(this.el().children).find(marker => {
                const { startTime, endTime } = marker.options_;
                return startTime <= mouseTime && mouseTime <= endTime;
            });

            if (marker) {
                marker.classList.add('show-label');
            }
        }

        // Reset and remove all marker children
        resetChildren() {
            this.children().forEach(child => child.dispose());
            this.children_ = [];
            videojs.dom.emptyEl(this.el());
        }

        // Build CSS class string
        buildCSSClass() {
            return `cst-markers ${super.buildCSSClass()}`.trim();
        }

        // Create element for the markers display
        createEl() {
            return videojs.dom.createEl('div', { className: this.buildCSSClass() });
        }

        // Dispose of the component and remove event listeners
        dispose() {
            this.player().off('loadstart', this.resetChildren);
            this.player().off('loadeddata', this.loadMarkers);
            this.player().off('playerreset', this.resetChildren);
            this.resetChildren();
            super.dispose();
        }
    }

    videojs.registerComponent('MarkersDisplay', MarkersDisplay);

    // MarkerDisplay class extends the Video.js Component
    class MarkerDisplay extends videojs.getComponent('Component') {
        constructor(player, options) {
            super(player, options);
            const { gap } = options;

            // Bind methods to ensure proper context
            this.updateMarkerPlayed = this.updateMarkerPlayed.bind(this);
            this.updateMarkerBuffered = this.updateMarkerBuffered.bind(this);
            this.setMarkerWidth(this.calculateMarkerWidth(), gap);

            // Add event listeners
            this.player().on('timeupdate', this.updateMarkerPlayed);
            this.player().on('progress', this.updateMarkerBuffered);
        }

        // Set marker width with optional gap
        setMarkerWidth(width, gap) {
            const style = gap !== undefined ? `width: calc(${width}% - ${gap})` : `width: ${width}%`;
            this.setAttribute('style', style);
        }

        // Calculate marker width as a percentage of the video duration
        calculateMarkerWidth() {
            const { endTime, startTime } = this.options();
            return ((endTime - startTime) / this.player().duration()) * 100;
        }

        // Update marker position based on current time
        updateMarker(currentTime = 0, property) {
            if (!this.parentComponent_.el().getClientRects().length) return;

            const duration = this.player().duration();
            const parentWidth = this.parentComponent_.el().getClientRects()[0].width;
            const markerOffsetLeft = this.el().offsetLeft;
            const startTime = (duration * markerOffsetLeft) / parentWidth;
            const endTime = (duration * (markerOffsetLeft + this.el().offsetWidth)) / parentWidth;

            if (currentTime > endTime) {
                this.el().style.setProperty(property, '200%');
            } else if (currentTime < startTime) {
                this.el().style.setProperty(property, '0%');
            } else {
                this.el().style.setProperty(property, `${100 * Math.abs((currentTime - startTime) / (endTime - startTime))}%`);
            }
        }

        // Update marker based on buffered time
        updateMarkerBuffered() {
            this.updateMarker(this.player().bufferedEnd(), '--_cst-marker-buffered');
        }

        // Update marker based on played time
        updateMarkerPlayed() {
            this.updateMarker(this.player().currentTime(), '--_cst-marker-played');
        }

        // Build CSS class string
        buildCSSClass() {
            return `cst-marker ${super.buildCSSClass()}`.trim();
        }

        // Create element for the marker display
        createEl() {
            const el = super.createEl('div', { className: this.buildCSSClass() });
            const { label } = this.options();

            if (label) {
                const labelEl = videojs.dom.createEl('span', { className: 'marker-label', textContent: label });
                el.appendChild(labelEl);
            }

            return el;
        }

        // Dispose of the component and remove event listeners
        dispose() {
            this.player().off('timeupdate', this.updateMarkerPlayed);
            this.player().off('progress', this.updateMarkerBuffered);
            super.dispose();
        }
    }

    videojs.registerComponent('MarkerDisplay', MarkerDisplay);

    // CustomMouseTimeDisplay class extends the Video.js MouseTimeDisplay
    class CustomMouseTimeDisplay extends videojs.getComponent('MouseTimeDisplay') {
        constructor(player, options) {
            super(player, videojs.mergeOptions({ children: [{ componentClass: 'TimeTooltip', name: 'timeTooltip' }] }, options));
        }

        // Build CSS class string
        buildCSSClass() {
            return `vjs-simple-markers ${super.buildCSSClass()}`.trim();
        }
    }

    videojs.registerComponent('MouseTimeDisplay', CustomMouseTimeDisplay);

    // CustomTimeTooltip class extends the Video.js TimeTooltip
    class CustomTimeTooltip extends videojs.getComponent('TimeTooltip') {
        update(content) {
            this.write(content);
        }

        // Update time tooltip based on event
        updateTime(event, percent, time, callback) {
            this.requestNamedAnimationFrame('TimeTooltip#updateTime', () => {
                const duration = this.player_.duration();
                const liveTracker = this.player_.liveTracker;
                const timeText = liveTracker && liveTracker.isLive()
                    ? ((liveWindow = liveTracker.liveWindow()), `${(liveWindow - percent * liveWindow) < 1 ? '' : '-'}${videojs.formatTime(liveWindow - percent * liveWindow, liveWindow)}`)
                    : videojs.formatTime(time, duration);

                this.update(timeText);
                if (callback) callback();
            });
        }
    }

    videojs.registerComponent('TimeTooltip', CustomTimeTooltip);

    // ChapterPlugin class extends the Video.js plugin
    class ChapterPlugin extends videojs.getPlugin('plugin') {
        constructor(player, options) {
            super(player, options);
            this.markers = options.markers || [];
            player.addClass('chapter-markers');
            player.getChild('ControlBar').getChild('ProgressControl').getChild('SeekBar').addChild('MarkersDisplay', { componentClass: 'MarkersDisplay' });

            this.loadedMetadata = this.loadedMetadata.bind(this);
            player.on('loadedmetadata', this.loadedMetadata);
        }

        // Add markers to the video
        addMark(markers = []) {
            if (!markers.length) return;

            const track = this.player.addTextTrack('metadata', 'chapter-markers', this.player.language());
            markers.forEach((marker, index, markers) => {
                const { startTime, label } = marker;
                const nextMarker = markers[index + 1];
                const cue = { startTime, endTime: nextMarker ? nextMarker.startTime : this.player().duration(), text: JSON.stringify(marker) };

                track.addCue(cue);
            });
        }

        // Load markers on metadata loaded event
        loadedMetadata() {
            if (this.markers.length) {
                this.markersTrack = this.player.addTextTrack('metadata', 'chapter-markers', this.player.language());

                this.markers.forEach((marker, index, markers) => {
                    const { startTime, label } = marker;
                    const nextMarker = markers[index + 1];
                    const cue = { startTime, endTime: nextMarker ? nextMarker.startTime : this.player.duration(), text: JSON.stringify(marker) };

                    this.markersTrack.addCue(cue);
                });
            }
        }

        // Dispose of the plugin
        dispose() {
            super.dispose();
            videojs.log('The advanced plugin is being disposed');
        }

        // Update plugin state
        updateState() {
            this.setState({ playing: !this.player.paused() });
        }

        // Log current state
        logState(event) {
            videojs.log(`The player is now ${this.state.playing ? 'playing' : 'paused'}`);
        }
    }

    videojs.registerPlugin('chapter', ChapterPlugin);
})();
