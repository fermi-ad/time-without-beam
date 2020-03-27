import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Grid, TextField, FormControlLabel, Checkbox, Button } from '@material-ui/core';
import { formatISO, subDays } from 'date-fns';

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 200,
    },
    buttons: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    button: {
        marginTop: theme.spacing(13),
        marginLeft: theme.spacing(13),
    },
}));

const formatISOTrimmed = (date: Date) => {
    // "2017-05-24T10:30"
    return formatISO(date).slice(0, 16);
}

// TODO: upgrade to MuiPickers when they are done upgrading to v4
const Config: React.FC = () => {
    const classes = useStyles();

    const [activeStep, setActiveStep] = React.useState(0);

    const handleNext = () => {
        setActiveStep(activeStep + 1);
    };

    return (
        <>
            <Grid container spacing={10}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="h6" gutterBottom>
                        Window
                    </Typography>
                    <Grid container>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                id="datetime-local"
                                label="Start time"
                                type="datetime-local"
                                defaultValue={formatISOTrimmed(subDays(new Date(), 1))}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                id="datetime-local"
                                label="End time"
                                type="datetime-local"
                                defaultValue={formatISOTrimmed(new Date())}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Grid container>
                        <Typography variant="h6" gutterBottom>
                            Devices
                        </Typography>
                        <Grid item xs={12}>
                            <TextField
                                required
                                id="device"
                                name="device"
                                label="Device"
                                fullWidth
                                value="E:TR101D"
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <div className={classes.buttons}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    className={classes.button}
                >
                    Calculate
                    </Button>
            </div>
        </>
    )
}

export default Config;
