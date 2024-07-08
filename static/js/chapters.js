(() => {
    class e extends videojs.getComponent("Component") {
        constructor(e, t = {}) {
            super(e, t),
                (this.resetChildren = this.resetChildren.bind(this)),
                (this.loadMarkers = this.loadMarkers.bind(this)),
                (this.onProgressBarHover = this.onProgressBarHover.bind(this)),
                this.player().on("loadstart", this.resetChildren),
                this.player().on("loadeddata", this.loadMarkers),
                this.player().on("playerreset", this.resetChildren);
        }
        loadMarkers() {
            let e = Array.from(this.player().textTracks()).find((e) => "chapter-markers" === e.label);
            if (!e) return void this.addChild("marker-empty", { className: "marker-empty", componentClass: "MarkerDisplay", startTime: 0, endTime: this.player().duration() });
            let t = e.cues_,
                r = videojs.computedStyle(this.el(), "gap");
            t.forEach((e, t, s) => {
                let a = e.startTime,
                    i = JSON.parse(e.text).label;
                if (this.player().duration() > a) {
                    if (0 === t && a > 0) {
                        let e = "marker-empty";
                        this.addChild(e, { className: e, componentClass: "MarkerDisplay", endTime: a, gap: r, startTime: 0, label: i });
                    }
                    let l = `marker-${t}`,
                        o = s[t + 1];
                    this.addChild(l, { className: l, componentClass: "MarkerDisplay", endTime: e.endTime, gap: o ? r : void 0, startTime: a, label: i });
                }
            });
            const s = this.player().getChild("ControlBar").getChild("ProgressControl");
            console.log("Children of ControlBar:", this.player().getChild("ControlBar").children()),
                console.log("Children of ProgressControl:", s.children()),
                s.on("mousemove", this.onProgressBarHover),
                s.on("mouseleave", () => {
                    this.el()
                        .querySelectorAll(".cst-marker")
                        .forEach((e) => e.classList.remove("show-label"));
                });
        }
        onProgressBarHover(e) {
            const t = this.player().getChild("ControlBar").getChild("ProgressControl").getChild("SeekBar").getChild("MouseTimeDisplay").getMouseTime(e);
            this.el()
                .querySelectorAll(".cst-marker")
                .forEach((e) => e.classList.remove("show-label"));
            const r = Array.from(this.el().children).find((e) => {
                const r = e.options_;
                return r.startTime <= t && t <= r.endTime;
            });
            r && r.classList.add("show-label");
        }
        resetChildren() {
            this.children().forEach((e) => {
                e.dispose();
            }),
                (this.children_ = []),
                videojs.dom.emptyEl(this.el());
        }
        buildCSSClass() {
            return `cst-markers ${super.buildCSSClass()}`.trim();
        }
        createEl() {
            return videojs.dom.createEl("div", { className: this.buildCSSClass() });
        }
        dispose() {
            this.player().off("loadstart", this.resetChildren), this.player().off("loadeddata", this.loadMarkers), this.player().off("playerreset", this.resetChildren), this.resetChildren(), super.dispose();
        }
    }
    videojs.registerComponent("MarkersDisplay", e);
    class t extends videojs.getComponent("Component") {
        constructor(e, t) {
            super(e, t);
            let { gap: r } = t;
            (this.updateMarkerPlayed = this.updateMarkerPlayed.bind(this)),
                (this.updateMarkerBuffered = this.updateMarkerBuffered.bind(this)),
                this.setMarkerWidth(this.markerWidth(), r),
                this.player().on("timeupdate", this.updateMarkerPlayed),
                this.player().on("progress", this.updateMarkerBuffered);
        }
        setMarkerWidth(e, t) {
            let r = void 0 !== t ? `width: calc(${e}% - ${t})` : `width: ${e}%`;
            this.setAttribute("style", r);
        }
        markerWidth() {
            let { endTime: e, startTime: t } = this.options();
            return ((e - t) / this.player().duration()) * 100;
        }
        updateMarker(e = 0, t) {
            if (!this.parentComponent_.el().getClientRects().length) return;
            let r = this.player().duration(),
                s = this.parentComponent_.el().getClientRects()[0].width,
                a = this.el().offsetLeft,
                i = (r * a) / s,
                l = (r * (a + this.el().offsetWidth)) / s;
            e > l && this.el().style.setProperty(t, "200%"), e < i && this.el().style.setProperty(t, "0%"), e >= i && e <= l && this.el().style.setProperty(t, 100 * Math.abs((e - i) / (l - i)) + "%");
        }
        updateMarkerBuffered() {
            this.updateMarker(this.player().bufferedEnd(), "--_cst-marker-buffered");
        }
        updateMarkerPlayed() {
            this.updateMarker(this.player().currentTime(), "--_cst-marker-played");
        }
        buildCSSClass() {
            return `cst-marker ${super.buildCSSClass()}`.trim();
        }
        createEl() {
            let e = super.createEl("div", { className: this.buildCSSClass() }),
                { label: t } = this.options();
            if (t) {
                let r = videojs.dom.createEl("span", { className: "marker-label", textContent: t });
                e.appendChild(r);
            }
            return e;
        }
        dispose() {
            this.player().off("timeupdate", this.updateMarkerPlayed), this.player().off("progress", this.updateMarkerBuffered), super.dispose();
        }
    }
    videojs.registerComponent("MarkerDisplay", t);
    class r extends videojs.getComponent("MouseTimeDisplay") {
        constructor(e, t) {
            super(e, videojs.mergeOptions({ children: [{ componentClass: "TimeTooltip", name: "timeTooltip" }] }, t));
        }
        buildCSSClass() {
            return `vjs-simple-markers ${super.buildCSSClass()}`.trim();
        }
        createEl() {
            return super.createEl();
        }
    }
    videojs.registerComponent("MouseTimeDisplay", r);
    class s extends videojs.getComponent("TimeTooltip") {
        update(e) {
            this.write(e);
        }
        updateTime(e, t, r, s) {
            this.requestNamedAnimationFrame("TimeTooltip#updateTime", () => {
                let e = this.player_.duration(),
                    a = this.player_.liveTracker && this.player_.liveTracker.isLive() ? ((e = this.player_.liveTracker.liveWindow()), ((a = e - t * e) < 1 ? "" : "-") + videojs.formatTime(a, e)) : videojs.formatTime(r, e);
                this.update(a), s && s();
            });
        }
    }
    videojs.registerComponent("TimeTooltip", s);
    let a = videojs.getPlugin("plugin");
    videojs.registerPlugin(
        "chapter",
        class extends a {
            constructor(e, t) {
                super(e, t),
                    (this.markers = t.markers),
                    this.markers || (this.markers = []),
                    e.addClass("chapter-markers"),
                    e.getChild("ControlBar").getChild("ProgressControl").getChild("SeekBar").addChild("MarkersDisplay", { componentClass: "MarkersDisplay" }),
                    (this.loadedMetadata = this.loadedMetadata.bind(this)),
                    e.on("loadedmetadata", this.loadedMetadata);
            }
            addMark(e = []) {
                if (!e.length) return;
                let t = this.player.addTextTrack("metadata", "chapter-markers", this.player.language());
                e.forEach((e, r, s) => {
                    let a = e.startTime,
                        i = (e.label, s[r + 1]),
                        l = { startTime: a, endTime: i ? i.startTime : this.player().duration(), text: JSON.stringify(e) };
                    t.addCue(l);
                });
            }
            loadedMetadata() {
                this.markers.length &&
                    ((this.markersTrack = this.player.addTextTrack("metadata", "chapter-markers", this.player.language())),
                    this.markers.forEach((e, t, r) => {
                        let s = e.startTime,
                            a = (e.label, r[t + 1]),
                            i = { startTime: s, endTime: a ? a.startTime : this.player.duration(), text: JSON.stringify(e) };
                        this.markersTrack.addCue(i);
                    }));
            }
            dispose() {
                super.dispose(), videojs.log("the advanced plugin is being disposed");
            }
            updateState() {
                this.setState({ playing: !this.player.paused() });
            }
            logState(e) {
                videojs.log("the player is now " + (this.state.playing ? "playing" : "paused"));
            }
        }
    );
})();
