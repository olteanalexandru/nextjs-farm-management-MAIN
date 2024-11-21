"use client";

import React from 'react';
import { useUserContext } from '../providers/UserStore';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export const UserInfos = () => {
    const { data, isUserLoggedIn, isLoading } = useUserContext();
    const t = useTranslations('Common');

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <span>{t('Loading user info...')}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {isUserLoggedIn ? (
                <>
                    {data.picture && (
                        <div className="w-8 h-8 rounded-full overflow-hidden relative">
                            <Image
                                src={data.picture}
                                alt="Profile"
                                width={32}
                                height={32}
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}
                    <span>{t('Welcome')}</span>
                    <strong>{data.name || data.email}</strong>
                    {data.roleType && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {data.roleType}
                        </span>
                    )}
                </>
            ) : (
                <span>{t('Please log in')}</span>
            )}
        </div>
    );
};
