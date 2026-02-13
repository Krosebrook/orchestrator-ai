import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Shield } from 'lucide-react';

export default function SkillVerificationBadge({ verified, verifiedBy, verificationPending }) {
    if (verificationPending) {
        return (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                <Clock className="h-3 w-3" />
                Pending
            </Badge>
        );
    }

    if (verified) {
        return (
            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
            </Badge>
        );
    }

    return null;
}