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
            normal: 'icons/diffNormal.png',
            normalplus: 'icons/diffNormalPlus.png',
            hard: 'icons/diffHard.png',
            hardlow: 'icons/diffHardLow.png',
            harder_than_hard: 'icons/diffHardPlus.png',
            extreme: 'icons/diffExtreme.png',
            extremelow: 'icons/diffExtremeLow.png',
            harder_than_extreme: 'icons/diffExtremePlus.png',
            insane: 'icons/diffInsane.png',
            insanelow: 'icons/diffInsaneLow.png',
            insaneplus: 'icons/diffInsanePlus.png',
            master: 'icons/diffmaster.png'
        };
        this.MAX_LENGTHS = {
            headerTitle: 16,
            passName: 25,
            songTitle: 30,
            songArtist: 30
        };

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.createSongCards(9);
        this.updateRoundCover();
        this.updateTextColors();
        this.setupTextLimiters();
        this.preventLineBreaks();

    }



    setupEventListeners() {
        document.getElementById('download-btn').addEventListener('click', () => {
            // Unfocus всех редактируемых элементов перед скачиванием
            document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                el.blur();
            });
            this.downloadPreview();
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        document.getElementById('song-upload').addEventListener('change', (e) => this.handleSongUpload(e));
        document.getElementById('bg-upload').addEventListener('change', (e) => this.handleBgUpload(e));

        this.headerColor.addEventListener('input', () => {
            this.headerSection.style.backgroundColor = this.headerColor.value;
            this.updateTextColors();
        });

        this.bgColor.addEventListener('input', () => {
            this.preview.style.backgroundColor = this.bgColor.value;
            this.preview.style.backgroundImage = 'none';
            this.updateTextColors();
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

        this.preview.addEventListener('click', (e) => {
            const target = e.target;
            if (target.hasAttribute('contenteditable')) {
                target.contentEditable = true;
                target.focus();
            }
        });

        this.songGrid.addEventListener('click', (e) => {
            if (e.target.closest('.icon')) {
                const card = e.target.closest('.song-card');
                this.showDifficultyMenu(card);
            }
        });

        this.songGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('song-cover')) {
                const card = e.target.closest('.song-card');
                this.changeSongCover(card);
            }
        });
    }

    setupTextLimiters() {
        // Ограничиваем длину текста в редактируемых элементах
        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.addEventListener('input', () => {
                let maxLength;
                if (el.classList.contains('song-title')) {
                    maxLength = this.MAX_LENGTHS.songTitle;
                } else if (el.classList.contains('song-artist')) {
                    maxLength = this.MAX_LENGTHS.songArtist;
                } else if (el.id === 'pass-name') {
                    maxLength = this.MAX_LENGTHS.passName;
                } else if (el.tagName === 'H1') {
                    maxLength = this.MAX_LENGTHS.headerTitle;
                }

                if (maxLength && el.textContent.length > maxLength) {
                    el.textContent = el.textContent.substring(0, maxLength);
                    // Перемещаем курсор в конец
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });
        });
    }

    preventLineBreaks() {
    const editableElements = document.querySelectorAll('header [contenteditable="true"]');

    editableElements.forEach(el => {
        // Запрет переноса строки
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                return false;
            }
        });

        // Удаление существующих переносов
        el.addEventListener('input', () => {
            el.textContent = el.textContent.replace(/[\r\n]/g, '');


        });

        // Фиксируем высоту элемента
        if (el.tagName === 'H1') {
            el.style.height = '24px';
            el.style.lineHeight = '24px';
        } else {
            el.style.height = '16px';
            el.style.lineHeight = '16px';
        }
        el.style.overflow = 'hidden';
    });
}

    createSongCards(count) {
    this.songGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-cover-container">
                <img src="assets/placeholder.png" alt="Cover" class="song-cover">
                <div class="icon">
                    <img src="icons/diffNormal.png" alt="Difficulty">
                </div>
            </div>
            <div class="song-text-container">
                <h2 class="song-title" contenteditable="true" data-i18n="song_title">Название песни</h2>
                <p class="song-artist" contenteditable="true" data-i18n="artist">Исполнитель</p>
            </div>
        `;
        this.songGrid.appendChild(card);
    }
    // Применяем перевод после создания карточек
    translateText();
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
                this.preview.style.backgroundPosition = 'center';
                this.preview.style.backgroundSize = 'cover';
                this.preview.style.backgroundRepeat = 'no-repeat';
                this.updateTextColors();
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
            this.roundCover.src = 'assets/cover.png';
        }
    }

    showDifficultyMenu(card) {
        const menu = document.createElement('div');
        menu.className = 'difficulty-menu';
        menu.style.display = 'grid';
        menu.style.gridTemplateColumns = 'repeat(4, 1fr)';
        menu.style.gap = '5px';

        Object.keys(this.difficultyIcons).forEach(difficulty => {
            const item = document.createElement('div');
            item.className = 'difficulty-item';
            const iconImg = document.createElement('img');
            iconImg.src = this.difficultyIcons[difficulty];
            iconImg.alt = difficulty;
            item.appendChild(iconImg);

            item.addEventListener('click', () => {
                const icon = card.querySelector('.icon img');
                icon.src = this.difficultyIcons[difficulty];
                icon.style.width = '25px';
                icon.style.height = '25px';
                document.body.removeChild(menu);
            });
            menu.appendChild(item);
        });

        const icon = card.querySelector('.icon');
        const rect = icon.getBoundingClientRect();
        menu.style.left = `${rect.left - 30}px`;
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

    updateTextColors() {
        const headerBgColor = this.headerSection.style.backgroundColor || this.headerColor.value;
        const previewBgColor = this.preview.style.backgroundColor || this.bgColor.value;
        const bgImage = this.preview.style.backgroundImage;

        const headerIsDark = this.isDarkColor(headerBgColor);
        let previewIsDark = this.isDarkColor(previewBgColor);

        // Если есть фоновое изображение, считаем фон темным (для лучшей читаемости)
        if (bgImage && bgImage !== 'none') {
            previewIsDark = true;
        }

        // Обновляем цвет текста в заголовке
        document.querySelectorAll('header h1, header p').forEach(el => {
            el.style.color = headerIsDark ? '#ffffff' : '#000000';
        });

        // Всегда белый цвет для текста песен с тенью
        document.querySelectorAll('.song-card h2, .song-card p').forEach(el => {
            el.style.color = '#ffffff';
            el.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
        });
    }


    isDarkColor(color) {
        const rgb = color.match(/\d+/g);
        if (!rgb) return true;

        const brightness = (parseInt(rgb[0]) * 299 +
            parseInt(rgb[1]) * 587 +
            parseInt(rgb[2]) * 114) / 1000;
        return brightness < 128;
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

    // Сброс текста по индексам
    const headerTexts = document.querySelectorAll('header [contenteditable="true"]');
    if (headerTexts[0]) headerTexts[0].textContent = 'PASS NAME';
    if (headerTexts[1]) headerTexts[1].textContent = 'BEATCLONE CUSTOM PASS';

    const headerTitle = document.querySelector('header h1');
    const passName = document.getElementById('pass-name');
    const seasonText = document.querySelector('header p:not(#pass-name)');

    if (headerTitle) {
        headerTitle.textContent = 'PASS NAME';
        headerTitle.style.fontSize = '20px';
        headerTitle.style.height = '24px';
        headerTitle.style.lineHeight = '24px';
    }

    if (passName) {
        passName.textContent = 'BEATCLONE CUSTOM PASS';
        passName.style.fontSize = '12px';
        passName.style.height = '16px';
        passName.style.lineHeight = '16px';
    }

    if (seasonText) {
        seasonText.textContent = 'SEASON SONGS';
    }

    document.querySelectorAll('.song-card').forEach(card => {
        card.querySelector('.song-cover').src = 'assets/placeholder.png';
        const iconImg = card.querySelector('.icon img');
        iconImg.src = 'icons/diffNormal.png';
        iconImg.style.width = '25px';
        iconImg.style.height = '25px';
        card.querySelector('.song-title').textContent = 'Название песни';
        card.querySelector('.song-artist').textContent = 'Исполнитель';
    });
    translateText();

    this.roundCover.src = 'assets/cover.png';
    this.uploadedCovers = [];
    this.updateTextColors();
}
}

document.addEventListener('DOMContentLoaded', () => {
    new BeatcloneEditor();
});