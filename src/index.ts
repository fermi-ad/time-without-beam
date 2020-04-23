import { DPM, DataReply, DataLoggerReply, DeviceInfo } from "@fnal/dpm-client";
import moment, { Duration } from "moment";
import momentDurationFormatSetup from "moment-duration-format";

momentDurationFormatSetup(moment);

console.clear();

const dpm = new DPM(`VIRT01`);
let windowLocation = new URL(window.location.href);
const shareUrlButton: HTMLButtonElement | null = document.querySelector(`#shareUrl`);
const addDeviceButton: HTMLButtonElement | null = document.querySelector(`#addDeviceInput`);
const getTimeWithoutBeamButton: HTMLButtonElement | null = document.querySelector(`#getTimeWithoutBeam`);
const t1Element: HTMLInputElement | null = document.querySelector(`#t1`);
const t2Element: HTMLInputElement | null = document.querySelector(`#t2`);
const devices: HTMLInputElement | null = document.querySelector(`#devices`);

if (!shareUrlButton || !addDeviceButton || !getTimeWithoutBeamButton || !t1Element || !t2Element || !devices) {
    throw new Error(`Missing expected elements on page`);
}

const getLastDeviceElement = (): Element => {
    const deviceInputs = document.querySelectorAll(`.deviceInputs`);
    return deviceInputs[deviceInputs.length - 1];
}

const getInputsFromList = (list: HTMLCollection | NodeList): (HTMLInputElement | HTMLSelectElement)[] => {
    const result = [...list].filter(node => {
        return node instanceof HTMLInputElement || node instanceof HTMLSelectElement;
    });

    return result as (HTMLInputElement | HTMLSelectElement)[];
}

const addDeviceInput = () => {
    if (devices) {
        const lastDeviceElement = getLastDeviceElement();
        const lastDeviceElementClone = lastDeviceElement.cloneNode(true);
        devices.insertBefore(lastDeviceElementClone, addDeviceButton)
    }
};

const drfToInput = (drf: string, inputs: (HTMLInputElement | HTMLSelectElement)[]) => {
    const [device, metaData, threshold] = drf.split(`@`);

    inputs[0].value = device || ``;
    inputs[5].value = threshold || `0`;

    if (metaData) {
        const [eventPeriod, rate, clockType, delay] = metaData.split(`,`);

        inputs[1].value = eventPeriod || `E`;
        inputs[2].value = rate || ``;
        inputs[3].value = clockType || `H`;
        inputs[4].value = delay || ``;
    }
};

const inputsToDrf = (inputs: (HTMLInputElement | HTMLSelectElement)[]): string => {
    const [
        device,
        eventPeriod,
        rate,
        clockType,
        delay,
        threshold
    ] = inputs.map(input => input.value);
    let drf = ``;

    if (device) {
        drf += device;
    } else {
        return ``;
    }

    if (rate) {
        drf += `@${eventPeriod},${rate}`;

        if (delay) {
            drf += `,${clockType},${delay}`;
        }
    }

    if (threshold) {
        drf += `@${threshold}`;
    }

    return drf;
};

const fillDeviceInputs = (t1: string, t2: string, devices: string[]) => {
    if (t1) {
        t1Element.value = t1;
    }

    if (t2) {
        t2Element.value = t2;
    }

    if (devices.length > 0) {
        devices.forEach((device, index) => {
            if (index > 0) {
                addDeviceInput();
            }

            const lastDeviceElement = getLastDeviceElement();
            const lastDeviceElementInputs = getInputsFromList(lastDeviceElement.children);

            drfToInput(device, lastDeviceElementInputs);
        });
    }
};

const fillInputsWithUrl = () => {
    if (!document) {
        throw new Error(`document does not exist`);
    }

    const params = (new URL(`${document.location}`)).searchParams;
    const t1 = params.get(`t1`) || ``;
    const t2 = params.get(`t2`) || ``;
    const devices = params.getAll(`device`) || ``;

    if (t1 || t2 || devices.length > 0) {
        fillDeviceInputs(t1, t2, devices);
    } else {
        return false;
    }

    return true;
}

const fillInputsWithLocalStorage = () => {
    const t1 = localStorage.getItem(`t1`) || ``;
    const t2 = localStorage.getItem(`t2`) || ``;
    const devices = localStorage.getItem(`devices`) || ``;

    if (t1 || t2 || devices.length > 0) {
        fillDeviceInputs(t1, t2, devices.split(`&`));
    }

    return true;
};

const deviceInputsToString = () => {
    const deviceInputs = document.querySelectorAll(`.deviceInputs`);
    let devices = ``;

    deviceInputs.forEach(device => {
        if (devices) devices += `&`;
        const inputs = getInputsFromList(device.children);

        devices += inputsToDrf(inputs);
    });

    return devices;
};

const saveInputsToLocalStorage = () => {
    const devices = deviceInputsToString();

    localStorage.setItem(`t1`, t1Element.value);
    localStorage.setItem(`t2`, t2Element.value);
    localStorage.setItem(`devices`, devices);
};

const reflectLocalStorageInUrl = () => {
    const t1 = localStorage.getItem(`t1`) || ``;
    const t2 = localStorage.getItem(`t2`) || ``;
    const devices = localStorage.getItem(`devices`) || ``;

    if (t1 || t2 || devices.length > 0) {
        const { origin, pathname } = new URL(window.location.href);
        // Strip off existing query parameters
        const newUrl = new URL(`${origin}${pathname}`);
        newUrl.searchParams.append(`t1`, t1);
        newUrl.searchParams.append(`t2`, t2);

        devices.split(`&`).forEach(device => {
            newUrl.searchParams.append(`device`, device);
        });

        windowLocation = newUrl;
    }
};

const copyUrlToClipboard = () => {
    const input = document.createElement(`input`);
    input.value = windowLocation.toString();
    input.setAttribute(`readonly`, ``);
    input.style.position = `absolute`;
    input.style.left = `-9999px`;
    document.body.appendChild(input);
    input.select();
    document.execCommand(`copy`);
    document.body.removeChild(input);
    alert(`Copied URL to clipboard`);
};

const calcTimeWithoutBeam = (values: number[], timestamps: number[], threshold: number) => {
    return moment.duration(timestamps.reduce((prev, current, index, array) => {
        if (index > 0)
            if (values[index] < threshold)
                prev += current - array[index - 1];

        return prev;
    }, 0), `milliseconds`);
};

const printTimeWithoutBeam = (parentElement: Element | null, deviceName: string, accumulatedDT: Duration, duration: Duration, noDataTime: Duration) => {
    const newRow = document.createElement(`tr`);
    const device = document.createElement(`td`);
    const timeWithoutBeam = document.createElement(`td`);
    const percentageWithoutBeam = document.createElement(`td`);
    const noData = document.createElement(`td`);
    const percentageWithoutBeamCalc = accumulatedDT.asMilliseconds() / duration.asMilliseconds() * 100;

    if (parentElement) {
        device.textContent = deviceName;
        timeWithoutBeam.textContent = accumulatedDT.format(`hh:mm:ss`);
        percentageWithoutBeam.textContent = `${percentageWithoutBeamCalc.toPrecision(4)}`;
        noData.textContent = noDataTime.format(`hh:mm:ss`);
        newRow.append(device);
        newRow.append(timeWithoutBeam);
        newRow.append(percentageWithoutBeam);
        newRow.append(noData);
        parentElement.append(newRow);
    }
};

const handleDPMData = (
    duration: Duration,
    threshold: number,
    outputElement: Element,
    drf: string
) => {
    const finalData: number[] = [];
    const finalTimes: number[] = [];

    return (data: DataReply | DataLoggerReply, info: DeviceInfo) => {
        if (info.name === `B:LMSCHG`) {
            console.log(data, info);
        }
        const dataLoggerData = data as DataLoggerReply;

        const deviceData = dataLoggerData.data as number[];
        const timestamps = dataLoggerData.micros as number[];

        if (deviceData.length === 0) {
            // Convert us to ms
            const msTimes = finalTimes.map(value => value / 1000);
            const dataTime = moment(msTimes[msTimes.length - 1]).diff(msTimes[0]);
            const noDataTime = moment.duration(duration).subtract(dataTime);
            let result = duration;

            if (msTimes.length > 0) {
                result = calcTimeWithoutBeam(finalData, msTimes, threshold).add(noDataTime);
            } else {
                console.log(`No TSs: ${info.name}`);
            }

            printTimeWithoutBeam(outputElement, info.name, result, duration, noDataTime);
        } else {
            finalData.push(...deviceData);
            finalTimes.push(...timestamps);
        }
    };
};

const handleDPMError = (err: any) => {
    console.error(`DPM Error: ${err.status.status}`);
    dpm.stop();
    dpm.clear();
};

const printDuration = (outputElement: Element, duration: Duration) => {
    outputElement.textContent = `Total time considered is ${duration.humanize()}`;
};

const removeAllChildren = (element: Element | null) => {
    if (element) {
        Array.from(element.childNodes).forEach(node => {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
    }
};

const getLoggerData = () => {
    dpm.stop();
    dpm.clear();

    const duration = moment.duration(moment(t2Element.value).diff(moment(t1Element.value)));
    const outputTable = document.querySelector(`#output`);

    if (outputTable) {
        const tBody = outputTable.querySelector(`tbody`);
        const caption = outputTable.querySelector(`caption`);
        const devices = deviceInputsToString().split(`&`);

        removeAllChildren(tBody);

        if (caption) {
            caption.textContent = ``;
        }

        const thresholdRegex = /(@|@(-?\d*(\.\d+)?))$/;

        if (tBody) {
            devices.forEach((device: string) => {
                const drfRequest = device.replace(thresholdRegex, ``);
                const thresholdExists = device.match(thresholdRegex);
                const threshold = thresholdExists
                    ? thresholdExists[2]
                        ? Number(thresholdExists[2])
                        : 1
                    : 1;

                dpm.addRequest(
                    drfRequest,
                    handleDPMData(duration, threshold, tBody, drfRequest),
                    handleDPMError
                );
            });
        }

        const loggerT1 = moment(t1Element.value).valueOf();
        const loggerT2 = moment(t2Element.value).valueOf();
        dpm.start(`LOGGER:${loggerT1}:${loggerT2}`);

        if (caption) {
            printDuration(caption, duration);
        }
    }
};

const removeParent = (element: Element) => {
    const parent = element.parentElement;

    if (parent) {
        const grandParent = parent.parentElement;

        if (grandParent) {
            grandParent.removeChild(parent);
        }
    }
};

const addListenersToRemoveButtons = () => {
    const removeRowButtons: NodeListOf<HTMLButtonElement> | null = document.querySelectorAll(`.removeRow`);
    const removeRowHandler = (button: Element) => {
        return () => {
            removeParent(button);
        }
    }

    if (removeRowButtons) {
        removeRowButtons.forEach(button => {
            button.addEventListener(`click`, removeRowHandler(button));
        });
    }
};

const isUrlParsed = fillInputsWithUrl();

if (!isUrlParsed) {
    fillInputsWithLocalStorage();
}

addDeviceButton.addEventListener(`click`, _ => {
    addDeviceInput();
    addListenersToRemoveButtons();
});

getTimeWithoutBeamButton.addEventListener(`click`, _ => {
    saveInputsToLocalStorage();
    reflectLocalStorageInUrl();
    getLoggerData();
});

shareUrlButton.addEventListener(`click`, _ => {
    copyUrlToClipboard();
});

addListenersToRemoveButtons();
