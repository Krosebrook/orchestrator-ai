// Extracted empty state component for better separation of concerns
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from 'lucide-react';

export default function EmptySessionsState({ onCreateSession }) {
    return (
        <Card>
            <CardContent className="pt-12 pb-12 text-center">
                <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No collaboration sessions yet</p>
                <Button onClick={onCreateSession}>
                    Create Your First Collaboration
                </Button>
            </CardContent>
        </Card>
    );
}