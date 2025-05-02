class BeatcloneEditor {
    constructor() {
        this.preview = document.getElementById('preview');
        this.songGrid = document.getElementById('song-grid');
        this.headerSection = document.getElementById('header-section');
        this.roundCover = document.getElementById('round-cover');
        this.headerColor = document.getElementById('header-color');
        this.bgColor = document.getElementById('bg-color');
        this.uploadedCovers = [];
        this.difficultyIcons = {
            hard: 'icons/hard.png',
            normal: 'icons/normal.png',
            extreme: 'icons/extreme.png',
            master: 'icons/master.png',
            better_than_hard: 'icons/better_than_hard.png',
            better_than_extreme: 'icons/better_than_extreme.png'
        };

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.createSongCards(9);
        this.updateRoundCover();
    }

    setupEventListeners() {
        document.getElementById('download-btn').addEventListener('click', () => this.downloadPreview());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        document.getElementById('song-upload').addEventListener('change', (e) => this.handleSongUpload(e));
        document.getElementById('bg-upload').addEventListener('change', (e) => this.handleBgUpload(e));

        this.headerColor.addEventListener('input', () => {
            this.headerSection.style.backgroundColor = this.headerColor.value;
        });

        this.bgColor.addEventListener('input', () => {
            this.preview.style.backgroundColor = this.bgColor.value;
            this.preview.style.backgroundImage = 'none';
        });

        this.roundCover.addEventListener('click', (e) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            this.roundCover.src = this.getSquareCroppedImage(img);
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });

        // Делегирование событий для редактируемых полей
        this.preview.addEventListener('click', (e) => {
            const target = e.target;
            if (target.hasAttribute('contenteditable')) {
                target.contentEditable = true;
                target.focus();
            }
        });

        // Делегирование событий для иконок сложности
        this.songGrid.addEventListener('click', (e) => {
            if (e.target.closest('.icon')) {
                const card = e.target.closest('.song-card');
                this.showDifficultyMenu(card);
            }
        });

        // Делегирование событий для замены обложек песен
        this.songGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('song-cover')) {
                const card = e.target.closest('.song-card');
                this.changeSongCover(card);
            }
        });
    }

    createSongCards(count) {
    this.songGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-cover-container">
                <img src="assets/placeholder.jpg" alt="Обложка" class="song-cover">
                <div class="icon">
                    <img src="icons/normal.png" alt="Сложность">
                </div>
            </div>
            <div class="song-text-container">
                <h2 class="song-title" contenteditable="true">Название песни</h2>
                <p class="song-artist" contenteditable="true">Исполнитель</p>
            </div>
        `;
        this.songGrid.appendChild(card);
    }
}

    handleSongUpload(event) {
        const files = event.target.files;
        this.uploadedCovers = Array.from(files);

        const cards = document.querySelectorAll('.song-card');
        Array.from(files).slice(0, 9).forEach((file, index) => {
            if (index >= cards.length) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    cards[index].querySelector('.song-cover').src = this.getSquareCroppedImage(img);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        this.updateRoundCover();
    }

    handleBgUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.preview.style.backgroundImage = `url(${e.target.result})`;
                this.preview.style.backgroundColor = 'transparent';
            };
            reader.readAsDataURL(file);
        }
    }

    changeSongCover(card) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        card.querySelector('.song-cover').src = this.getSquareCroppedImage(img);
                        if (!this.uploadedCovers.includes(file)) {
                            this.uploadedCovers.push(file);
                            this.updateRoundCover();
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    getSquareCroppedImage(img) {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            size,
            size
        );

        return canvas.toDataURL();
    }

    updateRoundCover() {
        if (this.uploadedCovers.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.uploadedCovers.length);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.roundCover.src = this.getSquareCroppedImage(img);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(this.uploadedCovers[randomIndex]);
        } else {
            this.roundCover.src = 'assets/round-cover.jpg';
        }
    }

    showDifficultyMenu(card) {
        const menu = document.createElement('div');
        menu.className = 'difficulty-menu';

        Object.keys(this.difficultyIcons).forEach(difficulty => {
            const item = document.createElement('div');
            item.className = 'difficulty-item';
            item.innerHTML = `<img src="${this.difficultyIcons[difficulty]}" alt="${difficulty}">`;
            item.addEventListener('click', () => {
                card.querySelector('.icon img').src = this.difficultyIcons[difficulty];
                document.body.removeChild(menu);
            });
            menu.appendChild(item);
        });

        const icon = card.querySelector('.icon');
        const rect = icon.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom}px`;

        document.body.appendChild(menu);

        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    downloadPreview() {
        html2canvas(this.preview, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: null
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'beatclone-pass.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    reset() {
        this.headerSection.style.backgroundColor = '#2a2a2a';
        this.headerColor.value = '#2a2a2a';
        this.preview.style.backgroundColor = '#333';
        this.preview.style.backgroundImage = 'none';
        this.bgColor.value = '#333333';

        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
            if (el.tagName === 'H1') el.textContent = 'METAL RISING';
            else if (el.tagName === 'P' && el.textContent.includes('BEATCLONE'))
                el.textContent = 'BEATCLONE CUSTOM PASS';
            else if (el.tagName === 'P' && el.textContent.includes('SEASON'))
                el.textContent = 'SEASON SONGS';
        });

        document.querySelectorAll('.song-card').forEach(card => {
            card.querySelector('.song-cover').src = 'assets/placeholder.jpg';
            card.querySelector('.icon img').src = 'icons/normal.png';
            card.querySelector('.song-title').textContent = 'Название песни';
            card.querySelector('.song-artist').textContent = 'Исполнитель';
        });

        this.roundCover.src = 'assets/round-cover.jpg';
        this.uploadedCovers = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BeatcloneEditor();
});