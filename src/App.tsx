import React, { useState } from 'react';
import DPM, { DPMContext, RequestMap } from "@fnal/app-framework/components/DPM";
import { DataLoggerReply } from "@fnal/dpm-client";
import './App.css';
import Paper from '@material-ui/core/Paper'
import Config from './components/Config'
import Chart from './components/Chart'
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import theme from './theme';
import { testData } from "./testData.json";

const useStyles = makeStyles(({ palette, spacing }: Theme) => createStyles({
  paper: {
    backgroundColor: palette.background.default,
    margin: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      margin: theme.spacing(6),
      padding: theme.spacing(12),
    },
  },
}));

const duration = 86400000
const deviceRequestList = [`E:TR101D@E,AE,E,900<-LOGGERDURATION:${duration * 8}`];
const chartData = [{ id: 0, data: [{ x: 1583623620000, y: 0 }, { x: 1583623621000, y: 1 }] }];

const App: React.FC = () => {
  const classes = useStyles();
  const [downtime, setDowntime] = useState(0);
  const threshold = 1;

  return (
    <>
      <Paper className={classes.paper}>
        <Config></Config>
      </Paper>
      {/* <Paper className={classes.paper} style={{height:'330px'}}>
        <Chart data={testData}></Chart>
      </Paper> */}
      <DPM drf={deviceRequestList}></DPM>
      <DPMContext.Consumer>
        {
          dpmContext => {
            console.log('dpmContext')
            const localContext = dpmContext as RequestMap;
            const deviceWeWant = deviceRequestList[0];

            if (localContext && localContext[deviceWeWant]) {
              const loggerReply = localContext[deviceWeWant].data as DataLoggerReply;
              const data = loggerReply.data as number[];
              const timestamps = loggerReply.micros as number[];

              for (let index = 0; index < data.length; index++) {
                if (data[index] < threshold) {
                  const deltaTime = timestamps[index] - timestamps[index - 1];
                  setDowntime(downtime + deltaTime);
                }
              }
            }

            if (downtime > 0) {
              return (
                <div style={{ display: "flex", justifyContent: "space-evenly" }}>
                  <span>
                    {localContext[deviceWeWant].info.name}
                  </span>
                  <span>
                    {localContext[deviceWeWant].info.description}
                  </span>
                  <span>
                    {`${downtime}ms without beam`}
                  </span>
                </div>
              );
            } else {
              return 'loading...';
            }
          }
        }
      </DPMContext.Consumer>
    </>
  );
}

export default App;