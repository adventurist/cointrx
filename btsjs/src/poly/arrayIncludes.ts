    interface Array<T> {
        includes(searchElement: T): boolean;
    }


if (!Array.prototype.includes) {
    Array.prototype.includes = (searchElement: any, ...args: number[]) => {
        if (this == null) {
            throw new TypeError("Array.prototype.includes called on null or undefined");
        }

        let O = Object(this);
        let len = parseInt(O.length, 10) || 0;
        if (len === 0) {
            return false;
        }

        let n = args[1] || 0;
        let k: any;

        if (n >= 0) {
            k = n;
        } else {
            k = len + n;

            if (k < 0) {
                k = 0;
            }
        }

        let currentElement: any;

        while (k < len) {
            currentElement = O[k];
            if (searchElement === currentElement ||
                (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
                return true;
            }
            k++;
        }

        return false;
    };
}