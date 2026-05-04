# TRACKING SPEC

## When an Action is created:
- messageContent must be saved
- strategyType must be assigned
- messageVariant must be assigned
- signalsSnapshot must be captured (even if empty object)

## When user sends message:
- status → SENT
- sentAt → timestamp

## When message is delivered (optional):
- status → DELIVERED
- deliveredAt → timestamp

## When user gets reply:
- status → REPLIED
- replyType must be selected (forced)
- replyContent must be saved
- repliedAt → timestamp

## When no reply after X days:
- status → NO_RESPONSE