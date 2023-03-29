import Monitor from "./monitor";

export default class MonitorExpectedPrefix extends Monitor {

    constructor(name, channel, params, env, input){
        super(name, channel, params, env, input);
        this.thresholdMinPeers = (params && params.thresholdMinPeers != null) ? params.thresholdMinPeers : 3;
        this.updateMonitoredResources();
    };

    updateMonitoredResources = () => {
        this.monitored = this.input.getMonitoredPrefixes();
    };

    filter = (message) => {
        return message.type === 'announcement';
    };

    squashAlerts = (alerts) => {
        const peers = [...new Set(alerts.map(alert => alert.matchedMessage.peer))].length;

        if (peers >= this.thresholdMinPeers) {
            const matchedRule = alerts[0].matchedRule;
            const message = alerts[0].matchedMessage;
            return `${message.originAS} is announcing ${matchedRule.prefix} (${matchedRule.description}). This prefix is in the configured list of announced prefixes`

        }

        return false;
    };

    monitor = (message) =>
        new Promise((resolve, reject) => {

            const messageOrigin = message.originAS;
            const messagePrefix = message.prefix;
            const matchedRule = this.getMonitoredAsMatch(messageOrigin);

            if (matchedRule) {

                const matchedPrefixRule = this.getMoreSpecificMatch(messagePrefix, false);
                if (matchedPrefixRule) {
                    this.publishAlert(messageOrigin.getId().toString() + "-" + messagePrefix + "-expected",
                        messageOrigin.getId(),
                        matchedPrefixRule,
                        message,
                        {});
                }
            }

            resolve(true);
        });

}