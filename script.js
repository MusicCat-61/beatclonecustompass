class BeatcloneEditor {
    constructor() {
        this.preview = document.getElementById('preview');
        this.songGrid = document.getElementById('song-grid');
        this.headerSection = document.getElementById('header-section');
        this.roundCover = document.getElementById('round-cover');
        this.headerColor = document.getElementById('header-color');
        this.bgColor = document.getElementById('bg-color');
        this.isFileDialogOpen = false; // Для changeSongCover и handleSongUpload
        this.isRoundCoverDialogOpen = false; // Для changeRoundCover
        this.isDownloadDialogOpen = false;
        this._isProcessingRoundCover = false;
        this._isProcessingDownload = false;
        this.uploadedCovers = [];
        this.songCount = 9;
        this.countValueElement = document.querySelector('.count-value');
        this.minusBtn = document.querySelector('.minus-btn');
        this.plusBtn = document.querySelector('.plus-btn');

        this.difficultyIcons = {
            normal: 'icons/diffNormal.png',
            harder_than_normal: 'icons/diffNormalPlus.png',
            hard: 'icons/diffHard.png',
            easier_than_hard: 'icons/diffHardLow.png',
            harder_than_hard: 'icons/diffHardPlus.png',
            extreme: 'icons/diffExtreme.png',
            easier_than_extreme: 'icons/diffExtremeLow.png',
            harder_than_extreme: 'icons/diffExtremePlus.png',
            insane: 'icons/diffInsane.png',
            easier_than_insane: 'icons/diffInsaneLow.png',
            harder_than_insane: 'icons/diffInsanePlus.png',
            master: 'icons/diffmaster.png'
        };
        this.MAX_LENGTHS = {
            headerTitle: 18,
            passName: 26,
            songTitle: 30,
            songArtist: 25
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
        document.getElementById('download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.downloadPreview();
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        document.getElementById('song-upload').addEventListener('change', (e) => this.handleSongUpload(e));
        document.getElementById('bg-upload').addEventListener('change', (e) => this.handleBgUpload(e));

        document.getElementById('search-btn').addEventListener('click', async () => {
            const artist = document.getElementById("artist").value;
            const track = document.getElementById("track").value;
            const cardNumber = parseInt(document.getElementById("card-number").value) - 1;

            if (!artist || !track) {
                alert("Пожалуйста, введите название трека и исполнителя\nPlease enter the track name and artist");
                return;
            }

            const cards = document.querySelectorAll('.song-card');
            if (cardNumber < 0 || cardNumber >= cards.length) {
                alert("Некорректный номер карточки");
                return;
            }

            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}+${encodeURIComponent(track)}&entity=song&limit=1`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.results && data.results[0]?.artworkUrl100) {
                    const coverUrl = data.results[0].artworkUrl100.replace("100x100", "500x500");
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        cards[cardNumber].querySelector('.song-cover').src = this.getSquareCroppedImage(img);
                        // Обновляем текст карточки
                        cards[cardNumber].querySelector('.song-title').textContent = track;
                        cards[cardNumber].querySelector('.song-artist').textContent = artist;
                    };
                    img.src = coverUrl;
                } else {
                    alert("Обложка не найдена 😢\nCover not found");
                    cards[cardNumber].querySelector('.song-title').textContent = track;
                    cards[cardNumber].querySelector('.song-artist').textContent = artist;
                }
            } catch (error) {
                console.error("Ошибка при запросе к API:", error);
                alert("Ошибка при запросе к API\nAPI request error");
            }
        });


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
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.changeRoundCover();
    });

        this.preview.addEventListener('click', (e) => {
            const target = e.target;
            if (target.hasAttribute('contenteditable')) {
                target.contentEditable = true;
                target.focus();
            }
        });

        this.songGrid.addEventListener('click', (e) => {
        // Проверяем, был ли клик по изображению иконки сложности
        if (e.target.closest('.icon img')) {
            const card = e.target.closest('.song-card');
            this.showDifficultyMenu(card);
            e.stopPropagation(); // Останавливаем всплытие

        }

        // Проверяем, был ли клик именно по изображению обложки
        if (e.target.classList.contains('song-cover') && e.target.tagName === 'IMG') {
            const card = e.target.closest('.song-card');
            this.changeSongCover(card);
            e.stopPropagation(); // Останавливаем всплытие

        }
    });
        this.minusBtn.addEventListener('click', () => this.changeSongCount(-1));
        this.plusBtn.addEventListener('click', () => this.changeSongCount(1));
    }

    changeSongCount(change) {
    const newCount = this.songCount + change;
    if (newCount >= 1 && newCount <= 9) { // You can adjust max count as needed
        this.songCount = newCount;
        this.countValueElement.textContent = newCount;
        this.createSongCards(newCount);
    }
}

    setupTextLimiters() {
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.addEventListener('input', (e) => {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const cursorPos = range.startOffset;
            const isComposing = e.isComposing;

            if (isComposing) return;

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

            if (maxLength) {
                // Удаляем все пробелы в начале и конце
                const originalText = el.textContent.trim();

                // Обрезаем текст до максимальной длины
                const newText = originalText.slice(0, maxLength);

                if (originalText !== newText) {
                    el.textContent = newText;

                    // Восстанавливаем позицию курсора
                    const newRange = document.createRange();
                    const textNode = el.firstChild || document.createTextNode('');

                    if (!el.firstChild) el.appendChild(textNode);

                    newRange.setStart(textNode, Math.min(cursorPos, newText.length));
                    newRange.collapse(true);

                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
            }
        });

        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') e.preventDefault();

            const maxLength = this._getMaxLengthForElement(el);
            if (maxLength && el.textContent.length >= maxLength &&
                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
            }
        });
    });


        // Обработка специальных клавиш
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') e.preventDefault();

            const isDeletion = e.key === 'Backspace' || e.key === 'Delete';
            if (isDeletion) return;

            const maxLength = this._getMaxLengthForElement(el);
            if (maxLength && el.textContent.length >= maxLength) {
                e.preventDefault();
            }
        });

}

_getMaxLengthForElement(el) {
    if (el.classList.contains('song-title')) return this.MAX_LENGTHS.songTitle;
    if (el.classList.contains('song-artist')) return this.MAX_LENGTHS.songArtist;
    if (el.id === 'pass-name') return this.MAX_LENGTHS.passName;
    if (el.tagName === 'H1') return this.MAX_LENGTHS.headerTitle;
    return null;
}

preventLineBreaks() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');

    editableElements.forEach(el => {
        el.style.whiteSpace = 'nowrap';
        el.style.overflow = 'visible';  // Изменили с 'hidden' на 'visible'
        el.style.textOverflow = 'clip';  // Убрали 'ellipsis'
        el.style.display = 'inline-block';
        el.style.width = 'auto';         // Или '100%' в зависимости от макета
    });
}

    createSongCards(count) {
    // Сохраняем текущие данные карточек
    const currentCards = Array.from(this.songGrid.children).map(card => ({
        cover: card.querySelector('.song-cover').src,
        title: card.querySelector('.song-title').textContent,
        artist: card.querySelector('.song-artist').textContent,
        difficulty: card.querySelector('.icon img').src
    }));

    this.songGrid.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'song-card';

        // Используем сохраненные данные или значения по умолчанию
        const cardData = currentCards[i] || {
            cover: 'assets/placeholder.png',
            title: 'Название песни', // Дефолтное значение, translateText обновит его
            artist: 'Исполнитель',  // Дефолтное значение, translateText обновит его
            difficulty: 'icons/diffNormal.png'
        };

        card.innerHTML = `
            <div class="song-cover-container">
                <img src="${cardData.cover}" alt="Cover" class="song-cover">
                <div class="icon">
                    <img src="${cardData.difficulty}" alt="Difficulty">
                </div>
            </div>
            <div class="song-text-container">
                <h2 class="song-title" contenteditable="true" data-i18n="song_title">${cardData.title}</h2>
                <p class="song-artist" contenteditable="true" data-i18n="artist">${cardData.artist}</p>
            </div>
        `;
        this.songGrid.appendChild(card);
    }

    // Обновляем счетчик коллекции
    const collectedText = document.querySelector('header p:last-child');
    if (collectedText) {
        collectedText.textContent = `0/${count} COLLECTED`;
    }

    // Применяем перевод для новых карточек
    translateText();



}

    handleSongUpload(event) {
        if (this.isFileDialogOpen) return;
        this.isFileDialogOpen = true;

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
            reader.onloadend = () => {
                this.isFileDialogOpen = false;
            };
            reader.readAsDataURL(file);
        });

        this.updateRoundCover();
    }

    handleBgUpload(event) {
        if (this.isFileDialogOpen) return;
        this.isFileDialogOpen = true;

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
            reader.onloadend = () => {
                this.isFileDialogOpen = false;
            };
            reader.readAsDataURL(file);
        } else {
            this.isFileDialogOpen = false;
        }
    }

    changeRoundCover() {
        if (this.isRoundCoverDialogOpen || this._isProcessingRoundCover) return;
            this._isProcessingRoundCover = true;
            this.isRoundCoverDialogOpen = true;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        const cleanUp = () => {
            this.isRoundCoverDialogOpen = false;
            this._isProcessingRoundCover = false;
            input.remove();
        };

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.roundCover.src = this.getSquareCroppedImage(img);
                        if (!this.uploadedCovers.includes(file)) {
                            this.uploadedCovers.push(file);
                    }

                    };
                    img.src = event.target.result;
                };
                reader.onloadend = cleanUp;
                reader.readAsDataURL(file);
            } else {
                cleanUp();
            }
        });

        input.addEventListener('cancel', cleanUp);

        window.addEventListener('focus', () => {
            setTimeout(() => {
                if (this.isRoundCoverDialogOpen && document.activeElement !== input) {
                    cleanUp();
                }
            }, 300);
        });

        input.click();
    }

    changeSongCover(card) {
    if (this.isFileDialogOpen || card._isProcessingCoverChange) {
        return;
    }
    card._isProcessingCoverChange = true;

    this.isFileDialogOpen = true;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    const cleanUp = () => {
        this.isFileDialogOpen = false;
        card._isProcessingCoverChange = false;
        input.remove();
    };

    input.addEventListener('change', (e) => {
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
            reader.onloadend = cleanUp;
            reader.readAsDataURL(file);
        } else {
            cleanUp();
        }
    });

    input.addEventListener('cancel', cleanUp);

    // Добавляем обработчик для закрытия диалога при потере фокуса
    window.addEventListener('focus', () => {
        setTimeout(() => {
            if (this.isFileDialogOpen && document.activeElement !== input) {
                cleanUp();
            }
        }, 300);
    });

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
            item.dataset.difficulty = difficulty.replace(/_/g, ' ');
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
        if (this.isDownloadDialogOpen || this._isProcessingDownload) return;
        this._isProcessingDownload = true;
        this.isDownloadDialogOpen = true;

        // Снимаем фокус с редактируемых элементов
        document.querySelectorAll('[contenteditable="true"]').forEach(el => el.blur());

        const cleanUp = () => {
            this.isDownloadDialogOpen = false;
            this._isProcessingDownload = false;
        };

        const handleDownload = () => {
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
                cleanUp();
            }).catch(error => {
                console.error('Download error:', error);
                cleanUp();
            });
        };

        // Защита от потери фокуса
        const focusHandler = () => {
            setTimeout(() => {
                if (this.isDownloadDialogOpen && !document.hasFocus()) {
                    cleanUp();
                }
            }, 300);
        };

        window.addEventListener('focus', focusHandler);

        // Задержка для гарантированного снятия фокуса
        setTimeout(() => {
            handleDownload();
            window.removeEventListener('focus', focusHandler);
        }, 100);
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
        if (headerTexts[1]) headerTexts[1].textContent = 'DESCRIPTION PASS';

        const headerTitle = document.querySelector('header h1');
        const passName = document.getElementById('pass-name');
        const seasonText = document.querySelector('header p:not(#pass-name)');

        if (headerTitle) {
            headerTitle.textContent = 'PASS NAME';
            headerTitle.style.fontSize = '18px';
            headerTitle.style.height = '24px';
            headerTitle.style.lineHeight = '24px';
        }

        if (passName) {
            passName.textContent = 'DESCRIPTION PASS';
            passName.style.fontSize = '13px';
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
        this.songCount = 9;
        this.countValueElement.textContent = this.songCount;
        this.createSongCards(this.songCount);


    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BeatcloneEditor();
});