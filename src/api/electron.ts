declare global {
    interface Window {
        electron?: {
            invoke: (channel: string, data?: any) => Promise<any>;
        };
    }
}

export async function invoke(channel: string, data?: any) {

    if (!window.electron) {

        console.error("Electron API Not Found");

        return null;

    }

    return await window.electron.invoke(channel, data);

}