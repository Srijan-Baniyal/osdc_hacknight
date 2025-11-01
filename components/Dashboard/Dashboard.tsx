export default async function Dashboard() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold">Dashboard</h1>
                            <p className="text-muted-foreground mt-2">
                                Welcome back hello!
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 bg-card rounded-lg border shadow-sm">
                            <h3 className="text-lg font-semibold mb-2">Account Info</h3>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="text-muted-foreground">Email:</span>{" "}
                                    hello
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Name:</span>{" "}
                                    hello
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Email Verified:</span>{" "}
                                    hello   
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-card rounded-lg border shadow-sm">
                            <h3 className="text-lg font-semibold mb-2">Security</h3>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="text-muted-foreground">2FA Status:</span>{" "}
                                    hello
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-card rounded-lg border shadow-sm">
                            <h3 className="text-lg font-semibold mb-2">Session Info</h3>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="text-muted-foreground">Session ID:</span>{" "}
                                    hello
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Created:</span>{" "}
                                    hello
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
