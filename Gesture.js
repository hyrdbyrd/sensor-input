class Gesture {
    constructor(image, imageWrapper, navBright, navZoom, navRotate, fake) {
        this.image = image;
        this.wrapper = imageWrapper;
        // Navs
        this.bright = {
            value: 100,
            element: navBright,
            min: 50,
            max: 150
        };

        const cameraMaxOffset = -image.width + imageWrapper.offsetWidth;
        this.rotate = {
            x: cameraMaxOffset / 2 - imageWrapper.offsetWidth / 2,
            y: 0,
            minX: cameraMaxOffset,
            maxX: 0,
            minY: 0,
            maxY: image.height - imageWrapper.offsetHeight,
            element: navRotate
        };

        this.zoom = {
            value: 100,
            min: 100,
            max: 200,
            element: navZoom
        };
    
        this.pointers = {};

        // For debugging
        this.fake = fake;

        // Binding
        this.onDown = this.onDown.bind(this);
        this.onDblClick = this.onDblClick.bind(this);
        this.onMove = this.onMove.bind(this);
        this.onSingleGesture = this.onSingleGesture.bind(this);
        this.onMultiGesture = this.onMultiGesture.bind(this);
        this.onUp = this.onUp.bind(this);

        this.init();
    }

    init() {
        this.setState();

        // Remove draggable
        this.image.ondragstart = () => false;
        this.image.ondrag = () => false;
        // Add events
        this.image.addEventListener('pointerdown', this.onDown);
        this.image.addEventListener('dblclick', this.onDblClick);
        // For debug        
        this.fake.addEventListener('click', () => {
            this.fake.style.left = '';
            this.fake.style.top = '';
            delete this.pointers["fake"];
        })
    }

    onDown(event) {
        // Set pointer
        this.pointers[event.pointerId] = {
            x: event.clientX,
            y: event.clientY
        };

        // Add events
        this.image.addEventListener('pointermove', this.onMove);
        this.image.addEventListener('pointerup', this.onUp);
        this.image.addEventListener('pointercancel', this.onUp);

        if (!this.gesture && this.getLength(this.pointers) > 1) {
            const { pointers: p } = this;
            const { pointerId: id } = event;

            const id2 = this.findAnotherThan(id);

            // Set start of gesture
            this.gesture = {
                distanse: this.getDistanse(p[id], p[id2]),
                angle: this.getAngle(p[id], p[id2])
            }
        }
    }
    // On any move
    onMove(event) {
        const { pointerId: id } = event;
        // If we not down at this pointer
        if (!this.pointers[id]) return;

        // Previos pointer
        const prevP = this.pointers[id];        
        this.pointers[id] = {
            prevX: prevP.x,
            prevY: prevP.y,
            x: event.clientX,
            y: event.clientY
        };

        // If one finger
        if (this.getLength(this.pointers) > 1) {
            this.onMultiGesture(id);
        } else {
            this.onSingleGesture(this.pointers[id]);
        }

        // On every move, rewrite state
        this.setState();
    }

    onSingleGesture(pointer) {
        let { x, y, minX, maxX, minY, maxY } = this.rotate;

        x += pointer.x - pointer.prevX;
        y += (pointer.prevY - pointer.y) / 100;
        
        if (x > maxX) x = maxX;
        if (x < minX) x = minX;

        // In percents
        if (y > maxY) y = maxY;
        if (y < minY) y = minY;

        this.rotate.x = x;
        this.rotate.y = y;
    }

    onMultiGesture(id1) {
        const id2 = this.findAnotherThan(id1);

        const p1 = this.pointers[id1];
        const p2 = this.pointers[id2];

        if (this.gesture.type === 'pinch') {
            this.pinch(p1, p2);
        } else if (this.gesture.type === 'rotate') {
            this.rotateOf(p1, p2);
        } else {
            this.checkGesture(p1, p2);
        }
    }
    // Check, what is gesture
    // Args: pointer 1, pointer 2
    checkGesture(p1, p2) {
        const angleDiff = Math.abs(this.getAngle(p1, p2) - this.gesture.angle);
        const dDiff = Math.abs(this.getDistanse(p1, p2) - this.gesture.distanse);
        
        const setPrevious = () => {
            this.gesture.distanse = this.getDistanse(p1, p2);
            this.gesture.angle = this.getAngle(p1, p2);
        }
    
        if (dDiff > 32) {
            this.gesture.type = 'pinch';
            setPrevious();
            this.pinch(p1, p2);
        } else if (angleDiff > 8) {
            this.gesture.type = 'rotate';
            setPrevious();
            this.rotateOf(p1, p2);
        }
    }
    // Pinch to zoom
    // Args: pointer 1, pointer 2
    pinch(p1, p2) {
        let { value, max, min } = this.zoom;

        const newDistanse = this.getDistanse(p1, p2);

        const diff = newDistanse - this.gesture.distanse;
        this.gesture.distanse = newDistanse;

        value += diff;
        if (value > max) value = max;
        if (value < min) value = min;

        this.zoom.value = value;
    }
    // Rotate to bright
    // Args: pointer 1, pointer 2
    rotateOf(p1, p2) {
        let { value, min, max } = this.bright;
        
        const newAngle = this.getAngle(p1, p2);

        const diff = newAngle - this.gesture.angle;
        this.gesture.angle = newAngle;

        value += diff;
        if (value > max) value = max;
        if (value < min) value = min;

        this.bright.value = value;
    }
    // Returns id, from pointers
    findAnotherThan(id) {
        let res;
        for (let thisId in this.pointers)
            if (thisId !== id && 'x' in this.pointers[thisId])
                res = thisId;

        if (!res) {
            throw new Error(`Error: pointer with any id than ${id} not found!`);
        }

        return res;
    }

    onUp(event) {
        // Delete that pointer from object
        delete this.pointers[event.pointerId];
        // Length of pointerEvents
        const length = this.getLength(this.pointers);
        // Clear values
        this.gesture = undefined;
        
        // Remove not needs events
        if (length === 0) {
            this.image.removeEventListener('pointermove', this.onMove);
            this.image.removeEventListener('pointerup', this.onUp);
            this.image.removeEventListener('pointercancel', this.onUp);
        }
    }
    // Cr-te "лже-pointer"
    onDblClick(event) {
        if (this.pointers.fake) return;

        this.pointers['fake'] = {
            x: event.clientX,
            y: event.clientY
        };

        this.fake.style.left = `${event.clientX}px`;
        this.fake.style.top = `${event.clientY}px`;
    }
    // Set all styles, and log this all
    setState() {
        const { image } = this;
        let newStyle = `translate(${this.rotate.x}px, ${this.rotate.y}px)`;
        newStyle += `scale(${this.zoom.value / 100})`;

        let newFilter = `brightness(${this.bright.value}%)`;

        image.style.transform = newStyle;
        image.style.filter = newFilter;

        this.zoom.element.innerText = `Размер: ${this.zoom.value | 0}%`;
        this.rotate.element.innerText = `Позиция: ${-this.rotate.x | 0}:${this.rotate.y | 0}`;
        this.bright.element.innerText = `Яркость: ${this.bright.value | 0}%`;
    }
    // Returns length of object
    getLength(obj) {
        return Object.keys(obj).length;
    }
    // Returns distanse begind p1 and p2
    // Args: First pointer, and another pointer
    getDistanse(p1, p2) {
        const { xLine: x, yLine: y } = this.getLines(p1, p2);
        return Math.sqrt(x ** 2 + y ** 2);
    }
    // Returns angle behind p1 and p2
    // Args: First pointer, and another pointer
    getAngle(p1, p2) {
        const { xLine: x, yLine: y } = this.getLines(p1, p2);
        const r = Math.atan2(x, y);
        return 180 + Math.round(r * 180 / Math.PI);
    }
    // Returns lines (diff, behind p1 and p2)
    // Args: pointer 1, pointer 2
    getLines(p1, p2) {
        const { x: x1, y: y1 } = p1;
        const { x: x2, y: y2 } = p2;
        return { xLine: x1 - x2, yLine: y1 - y2 };
    }
}