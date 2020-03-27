import { DPM } from "@fnal/dpm-client";

const dpm = new DPM();

dpm.addRequest(
    'E:TR101D@E,AE,E,900<-LOGGERDURATION:86400000',
    (data, info) => {
        console.log(info);
        console.log(data);
    }
);

dpm.start();