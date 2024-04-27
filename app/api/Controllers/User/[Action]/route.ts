import { NextResponse, NextRequest } from 'next/server';
import User from '../../../Models/userModel';
import { connectDB } from '../../../../db';
import { getSession } from '@auth0/nextjs-auth0';

connectDB()

    export async function GET(request:NextRequest,context: any){
        const { params } = context;
        if(params.Action === 'fermieri'){
            const session = await getSession();
            const sessionUser = session?.user;
            if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
              }

            const fermierUsers = await User.find({ role: 'farmer' }) as  any;
            console.log(fermierUsers)
            return NextResponse.json(fermierUsers, { status: 200 });
        } 
        if(params.Action === "admin"){
            const session = await getSession();
            const user = session?.user;
            if (user.userRoles.includes('Admin') === false) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
              }
            const adminUsers = await User.find({ role: 'admin' }) as  any;
            return NextResponse.json(adminUsers, { status: 200 });
        }
    }
    export async function POST(request:NextRequest,context: any){ 
            const { params } = context;
            if(params.Action === 'register'){
                const session = await getSession()
                const sessionUser = session?.user;
                if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                    console.log(sessionUser.userRoles)
                    return NextResponse.json({ message: 'User is not admin' }, { status: 400 });
                }
                const { name, email,  role } = await request.json();

                const user = await User.create({
                    name,
                    email,
                    role: role.toLowerCase()
                });
                return NextResponse.json(user, { status: 201 });
            } else if (params.Action === 'changeRole') {
                const session = await getSession();
                const sessionUser = session?.user;
                if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                    return NextResponse.json({ message: 'User is not admin' }, { status: 401 });
                } 
                const { email, role } = await request.json();
                if (role !== 'admin' && role !== 'farmer') {
                    return NextResponse.json({ message: 'Role is invalid' }, { status: 400 });
                }
                const user = await User
                    .findOneAndUpdate({
                        email
                    }, {
                        role
                    }, {
                        new: true
                    });
                return NextResponse.json(user, { status: 201 });
            }
    }




export async function PUT(request:NextRequest,context: any){    
                const { params } = context;
                if(params.Action === 'fermieri'){
                    const session = await getSession()
                    const sessionUser = session?.user;
                    if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                        return NextResponse.json({ message: 'User not found' }, { status: 404 });
                    }
                    const { name, email,  role } = await request.json();
                    const user = await User.create({
                        name,
                        email,
                        role,
                    });
                    return NextResponse.json(user, { status: 201 });
                }
            }

export async function DELETE(request:NextRequest,context: any){
                    const { params } = context;
                
                        const session = await getSession()
                        const sessionUser = session?.user;
                        if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                            return NextResponse.json({ message: 'User not found' }, { status: 404 });
                        }
                        
                        const user = await User.findById(params.Action);
                        if (user) {
                            await user.remove();
                          NextResponse.json({ message: 'User removed' }, { status: 200 });
                        } else {
                           NextResponse.json({ message: 'User not found' }, { status: 404 });
                            throw new Error('User not found');
                        }
                    
                    }
                







