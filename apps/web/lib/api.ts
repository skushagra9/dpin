export interface Monitor {
    name: string;
    url: string;
    type: string;
    checkInterval: number;
}

export const fetchMonitors = async () => {
    const response = await fetch("/api/endpoints");
    return response.json();
};


export const fetchMonitorResults = async () => {
    const response = await fetch("/api/endpoints/status");
    return response.json();
};


export const createMonitor = async (monitor: Monitor) => {
    const response = await fetch("/api/endpoints", {
        method: "POST",
        body: JSON.stringify(monitor),
    });
    return response.json();
};