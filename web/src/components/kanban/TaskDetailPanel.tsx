import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { listComments, createComment, listTaskLabels, listAttachments, uploadAttachment, downloadAttachmentUrl } from '../../api/tasks';
import { Card } from '../../atoms/surface/Card';
import { Stack } from '../../layout/Stack';
import { TextInput } from '../../atoms/inputs/TextInput';
import { ButtonPrimary } from '../../atoms/buttons/ButtonPrimary';
import { MutedText } from '../../atoms/text/MutedText';
import { randomId } from '../../lib/id';

export function TaskDetailPanel(props: { accessToken: string; taskId: string }) {
    const [comment, setComment] = useState('');

    const cq = useQuery({
        queryKey: ['task', props.taskId, 'comments'],
        queryFn: () => listComments(props.accessToken, props.taskId)
    });

    const lq = useQuery({
        queryKey: ['task', props.taskId, 'labels'],
        queryFn: () => listTaskLabels(props.accessToken, props.taskId)
    });

    const aq = useQuery({
        queryKey: ['task', props.taskId, 'attachments'],
        queryFn: () => listAttachments(props.accessToken, props.taskId)
    });

    async function postComment() {
        if (!comment.trim()) return;
        await createComment(props.accessToken, props.taskId, comment, randomId(12));
        setComment('');
        await cq.refetch();
    }

    async function onPickFile(file: File) {
        await uploadAttachment(props.accessToken, props.taskId, file, randomId(12));
        await aq.refetch();
    }

    return (
        <Card>
            <Stack gap={12}>
                <strong>Task: {props.taskId}</strong>

                <div>
                    <div style={{ fontWeight: 600 }}>Labels</div>
                    {lq.data?.items?.length ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {lq.data.items.map((l) => (
                                <span key={l.id} style={{ background: l.color, padding: '2px 8px', borderRadius: 999, color: '#111827' }}>
                                    {l.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <MutedText>none</MutedText>
                    )}
                </div>

                <div>
                    <div style={{ fontWeight: 600 }}>Attachments</div>
                    <input type="file" onChange={(e) => (e.target.files?.[0] ? void onPickFile(e.target.files[0]) : null)} />
                    {aq.data?.items?.length ? (
                        <Stack gap={6}>
                            {aq.data.items.map((a) => (
                                <a key={a.id} href={downloadAttachmentUrl(props.taskId, a.id)} target="_blank" rel="noreferrer">
                                    {a.filename} ({a.sizeBytes} bytes)
                                </a>
                            ))}
                        </Stack>
                    ) : (
                        <MutedText>none</MutedText>
                    )}
                </div>

                <div>
                    <div style={{ fontWeight: 600 }}>Comments</div>
                    <Stack gap={8}>
                        <TextInput placeholder="Write comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
                        <ButtonPrimary onClick={() => void postComment()}>Post</ButtonPrimary>
                    </Stack>
                    {cq.data?.items?.length ? (
                        <Stack gap={8} style={{ marginTop: 12 }}>
                            {cq.data.items.map((c) => (
                                <Card key={c.id}>
                                    <div>{c.body}</div>
                                    <MutedText>{c.createdAt ?? ''}</MutedText>
                                </Card>
                            ))}
                        </Stack>
                    ) : (
                        <MutedText>no comments</MutedText>
                    )}
                </div>
            </Stack>
        </Card>
    );
}
