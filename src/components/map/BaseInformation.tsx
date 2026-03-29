import { Id } from '@cvx/_generated/dataModel';

interface Base {
  name: string;
  userId: Id<'users'>;
}

interface BaseInformationProps {
  base: Base | null | undefined;
  currentUserId?: Id<'users'>;
  currentUserName?: string;
}

export function BaseInformation({ base, currentUserId, currentUserName }: BaseInformationProps) {
  if (!base) {
    return null;
  }

  return (
    <div className="mt-4 p-3 border rounded-md bg-gray-800">
      <h3 className="font-semibold">Base Present</h3>
      <p>Name: {base.name}</p>
      <p>
        Owner:{' '}
        {base.userId === currentUserId
          ? currentUserName
          : 'Another Player'}{' '}
        {/* TODO: Fetch player name if not current user */}
      </p>
    </div>
  );
}