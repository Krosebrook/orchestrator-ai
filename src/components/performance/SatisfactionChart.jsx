import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

export default function SatisfactionChart({ metrics }) {
    const satisfactionMetrics = metrics.filter(m => 
        m.metric_type === 'user_satisfaction' && m.satisfaction_rating
    );
    
    // Group by agent
    const byAgent = satisfactionMetrics.reduce((acc, m) => {
        if (!acc[m.agent_name]) {
            acc[m.agent_name] = [];
        }
        acc[m.agent_name].push(m.satisfaction_rating);
        return acc;
    }, {});

    const avgByAgent = Object.entries(byAgent).map(([agent, ratings]) => ({
        agent,
        avgRating: (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2),
        count: ratings.length
    }));

    // Rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating: `${rating} Star${rating > 1 ? 's' : ''}`,
        count: satisfactionMetrics.filter(m => m.satisfaction_rating === rating).length
    }));

    // Trend over time
    const byDate = satisfactionMetrics.reduce((acc, m) => {
        const date = format(new Date(m.created_date), 'MM/dd');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(m.satisfaction_rating);
        return acc;
    }, {});

    const trendData = Object.entries(byDate).map(([date, ratings]) => ({
        date,
        avgRating: (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)
    }));

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Average Rating by Agent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={avgByAgent}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="agent" />
                                <YAxis domain={[0, 5]} />
                                <Tooltip />
                                <Bar dataKey="avgRating" fill="#8b5cf6" name="Avg Rating" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rating Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={distribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="rating" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f59e0b" name="Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Satisfaction Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="avgRating" stroke="#8b5cf6" name="Avg Rating" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}